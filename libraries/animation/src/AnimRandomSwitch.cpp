//
//  AnimRandomSwitch.cpp
//
//  Created by Angus Antley on 4/8/2019.
//  Copyright (c) 2019 High Fidelity, Inc. All rights reserved.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "AnimRandomSwitch.h"
#include "AnimUtil.h"
#include "AnimationLogging.h"

AnimRandomSwitch::AnimRandomSwitch(const QString& id) :
	AnimNode(AnimNode::Type::RandomSwitchStateMachine, id) {

}

AnimRandomSwitch::~AnimRandomSwitch() {

}

const AnimPoseVec& AnimRandomSwitch::evaluate(const AnimVariantMap& animVars, const AnimContext& context, float dt, AnimVariantMap& triggersOut) {
	float parentDebugAlpha = context.getDebugAlpha(_id);

    //qCDebug(animation) << "frames active " << _framesActive << " frames in session " << context.getFramesAnimatedThisSession();
    QString desiredStateID = _currentState->getID();
    //QString previousState = animVars.lookup(_currentStateVar, _currentState->getID());
    if (abs(_framesActive - context.getFramesAnimatedThisSession()) > 1) {
        // get a random number and decide which motion to choose.
        float dice = randFloatInRange(0.0f, 1.0f);
        float lowerBound = 0.0f;
        for (const RandomSwitchState::Pointer& randState : _randomStates) {
            float upperBound = lowerBound + randState->getPriority();
            if ((dice > lowerBound) && (dice < upperBound)) {
                desiredStateID = randState->getID();
                break;
            } else {
                lowerBound = upperBound;
            }
        }
    }
    _framesActive = context.getFramesAnimatedThisSession();

	//QString desiredStateID = animVars.lookup(_currentStateVar, _currentState->getID());
	if (_currentState->getID() != desiredStateID) {
		// switch states
		bool foundState = false;
		for (auto& randomState : _randomStates) {
			if (randomState->getID() == desiredStateID) {
				switchState(animVars, context, randomState);
				foundState = true;
				break;
			}
		}
		if (!foundState) {
			qCCritical(animation) << "AnimRandomSwitch could not find state =" << desiredStateID << ", referenced by _currentStateVar =" << _currentStateVar;
		}
	}

	// evaluate currentState transitions
	auto desiredState = evaluateTransitions(animVars);
	if (desiredState != _currentState) {
		switchState(animVars, context, desiredState);
	}

	assert(_currentState);
	auto currentStateNode = _children[_currentState->getChildIndex()];
	assert(currentStateNode);

	if (_duringInterp) {
       // qCDebug(animation) << "interping ";
		_alpha += _alphaVel * dt;
		if (_alpha < 1.0f) {
			AnimPoseVec* nextPoses = nullptr;
			AnimPoseVec* prevPoses = nullptr;
			AnimPoseVec localNextPoses;
			if (_interpType == InterpType::SnapshotBoth) {
				// interp between both snapshots
				prevPoses = &_prevPoses;
				nextPoses = &_nextPoses;
			} else if (_interpType == InterpType::SnapshotPrev) {
				// interp between the prev snapshot and evaluated next target.
				// this is useful for interping into a blend
				localNextPoses = currentStateNode->evaluate(animVars, context, dt, triggersOut);
				prevPoses = &_prevPoses;
				nextPoses = &localNextPoses;
			} else {
				assert(false);
			}
			if (_poses.size() > 0 && nextPoses && prevPoses && nextPoses->size() > 0 && prevPoses->size() > 0) {
				::blend(_poses.size(), &(prevPoses->at(0)), &(nextPoses->at(0)), _alpha, &_poses[0]);
			}
			context.setDebugAlpha(_currentState->getID(), _alpha * parentDebugAlpha, _children[_currentState->getChildIndex()]->getType());
		} else {
			_duringInterp = false;
			_prevPoses.clear();
			_nextPoses.clear();
		}
	}

	if (!_duringInterp) {
		context.setDebugAlpha(_currentState->getID(), parentDebugAlpha, _children[_currentState->getChildIndex()]->getType());
		_poses = currentStateNode->evaluate(animVars, context, dt, triggersOut);
	}
	processOutputJoints(triggersOut);

	context.addStateMachineInfo(_id, _currentState->getID(), _previousState->getID(), _duringInterp, _alpha);
	if (_duringInterp) {
		// hack: add previoius state to debug alpha map, with parens around it's name.
		context.setDebugAlpha(QString("(%1)").arg(_previousState->getID()), 1.0f - _alpha, AnimNodeType::Clip);
	}

	return _poses;
}

void AnimRandomSwitch::setCurrentState(RandomSwitchState::Pointer randomState) {
	_previousState = _currentState ? _currentState : randomState;
	_currentState = randomState;
}

void AnimRandomSwitch::addState(RandomSwitchState::Pointer randomState) {
	_randomStates.push_back(randomState);
}

void AnimRandomSwitch::switchState(const AnimVariantMap& animVars, const AnimContext& context, RandomSwitchState::Pointer desiredState) {

	const float FRAMES_PER_SECOND = 30.0f;

	auto prevStateNode = _children[_currentState->getChildIndex()];
	auto nextStateNode = _children[desiredState->getChildIndex()];

	_duringInterp = true;
	_alpha = 0.0f;
	float duration = std::max(0.001f, animVars.lookup(desiredState->_interpDurationVar, desiredState->_interpDuration));
	_alphaVel = FRAMES_PER_SECOND / duration;
	_interpType = (InterpType)animVars.lookup(desiredState->_interpTypeVar, (int)desiredState->_interpType);

	// because dt is 0, we should not encounter any triggers
	const float dt = 0.0f;
	AnimVariantMap triggers;

	if (_interpType == InterpType::SnapshotBoth) {
		// snapshot previous pose.
		_prevPoses = _poses;
		// snapshot next pose at the target frame.
		nextStateNode->setCurrentFrame(desiredState->_interpTarget);
		_nextPoses = nextStateNode->evaluate(animVars, context, dt, triggers);
	} else if (_interpType == InterpType::SnapshotPrev) {
		// snapshot previoius pose
		_prevPoses = _poses;
		// no need to evaluate _nextPoses we will do it dynamically during the interp,
		// however we need to set the current frame.
		nextStateNode->setCurrentFrame(desiredState->_interpTarget - duration);
	} else {
		assert(false);
	}

#ifdef WANT_DEBUG
	qCDebug(animation) << "AnimRandomSwitch::switchState:" << _currentState->getID() << "->" << desiredState->getID() << "duration =" << duration << "targetFrame =" << desiredState->_interpTarget << "interpType = " << (int)_interpType;
#endif

	setCurrentState(desiredState);
}

AnimRandomSwitch::RandomSwitchState::Pointer AnimRandomSwitch::evaluateTransitions(const AnimVariantMap& animVars) const {
	assert(_currentState);
	for (auto& transition : _currentState->_transitions) {
		if (animVars.lookup(transition._var, false)) {
			//return transition._randomSwitchState;
		}
	}
	return _currentState;
}

const AnimPoseVec& AnimRandomSwitch::getPosesInternal() const {
	return _poses;
}
