//
//  AnimRandomSwitch.h
//
//  Created by Angus Antley on 4/8/19.
//  Copyright (c) 2019 High Fidelity, Inc. All rights reserved.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_AnimRandomSwitch_h
#define hifi_AnimRandomSwitch_h

#include <string>
#include <vector>
#include "AnimNode.h"

// State Machine for random transitioning between children AnimNodes
//
// This is mechinisim for playing animations and smoothly interpolating/fading
// between them.  A StateMachine has a set of States, which typically reference
// child AnimNodes.  Each State has a list of Transitions, which are evaluated
// to determine when we should switch to a new State.  Parameters for the smooth
// interpolation/fading are read from the State that you are transitioning to.
//
// The currentState can be set directly via the setCurrentStateVar() and will override
// any State transitions.
//
// Each State has two parameters that can be changed via AnimVars,
// * interpTarget - (frames) The destination frame of the interpolation. i.e. the first frame of the animation that will
//   visible after interpolation is complete.
// * interpDuration - (frames) The total length of time it will take to interp between the current pose and the
//   interpTarget frame.
// * interpType - How the interpolation is performed.
//   * SnapshotBoth: Stores two snapshots, the previous animation before interpolation begins and the target state at the
//     interTarget frame.  Then during the interpolation period the two snapshots are interpolated to produce smooth motion between them.
//   * SnapshotPrev: Stores a snapshot of the previous animation before interpolation begins.  However the target state is
//     evaluated dynamically.  During the interpolation period the previous snapshot is interpolated with the target pose
//     to produce smooth motion between them.  This mode is useful for interping into a blended animation where the actual
//     blend factor is not known at the start of the interp or is might change dramatically during the interp.

class AnimRandomSwitch : public AnimNode {
public:
	friend class AnimNodeLoader;
	friend bool processRandomSwitchStateMachineNode(AnimNode::Pointer node, const QJsonObject& jsonObj, const QString& nodeId, const QUrl& jsonUrl);

	enum class InterpType {
		SnapshotBoth = 0,
		SnapshotPrev,
		NumTypes
	};

protected:

	class RandomSwitchState {
	public:
		friend AnimRandomSwitch;
		friend bool processRandomSwitchStateMachineNode(AnimNode::Pointer node, const QJsonObject& jsonObj, const QString& nodeId, const QUrl& jsonUrl);

		using Pointer = std::shared_ptr<RandomSwitchState>;
		using ConstPointer = std::shared_ptr<const RandomSwitchState>;

		class Transition {
		public:
			friend AnimRandomSwitch;
			Transition(const QString& var, RandomSwitchState::Pointer randomState) : _var(var), _randomSwitchState(randomState) {}
		protected:
			QString _var;
			RandomSwitchState::Pointer _randomSwitchState;
		};

		RandomSwitchState(const QString& id, int childIndex, float interpTarget, float interpDuration, InterpType interpType, float priority, bool resume) :
			_id(id),
			_childIndex(childIndex),
			_interpTarget(interpTarget),
			_interpDuration(interpDuration),
			_interpType(interpType),
            _priority(priority),
            _resume(resume){
		}

		void setInterpTargetVar(const QString& interpTargetVar) { _interpTargetVar = interpTargetVar; }
		void setInterpDurationVar(const QString& interpDurationVar) { _interpDurationVar = interpDurationVar; }
		void setInterpTypeVar(const QString& interpTypeVar) { _interpTypeVar = interpTypeVar; }

		int getChildIndex() const { return _childIndex; }
		const QString& getID() const { return _id; }

	protected:

		void setInterpTarget(float interpTarget) { _interpTarget = interpTarget; }
		void setInterpDuration(float interpDuration) { _interpDuration = interpDuration; }
        void setPriority(float priority) { _priority = priority; }
        void setResumeFlag(bool resume) { _resume = resume; }

		void addTransition(const Transition& transition) { _transitions.push_back(transition); }

		QString _id;
		int _childIndex;
		float _interpTarget;  // frames
		float _interpDuration; // frames
		InterpType _interpType;
        float _priority {0.0f};
        bool _resume {false};

		QString _interpTargetVar;
		QString _interpDurationVar;
		QString _interpTypeVar;

		std::vector<Transition> _transitions;

	private:
		// no copies
		RandomSwitchState(const RandomSwitchState&) = delete;
		RandomSwitchState& operator=(const RandomSwitchState&) = delete;
	};

public:

	explicit AnimRandomSwitch(const QString& id);
	virtual ~AnimRandomSwitch() override;

	virtual const AnimPoseVec& evaluate(const AnimVariantMap& animVars, const AnimContext& context, float dt, AnimVariantMap& triggersOut) override;

	void setCurrentStateVar(QString& currentStateVar) { _currentStateVar = currentStateVar; }

protected:

	void setCurrentState(RandomSwitchState::Pointer randomState);

	void addState(RandomSwitchState::Pointer randomState);

	void switchState(const AnimVariantMap& animVars, const AnimContext& context, RandomSwitchState::Pointer desiredState);
	RandomSwitchState::Pointer evaluateTransitions(const AnimVariantMap& animVars) const;

	// for AnimDebugDraw rendering
	virtual const AnimPoseVec& getPosesInternal() const override;

	AnimPoseVec _poses;

    int _framesActive { 0 };
	// interpolation state
	bool _duringInterp = false;
	InterpType _interpType{ InterpType::SnapshotPrev };
	float _alphaVel = 0.0f;
	float _alpha = 0.0f;
	AnimPoseVec _prevPoses;
	AnimPoseVec _nextPoses;

	RandomSwitchState::Pointer _currentState;
	RandomSwitchState::Pointer _previousState;
	std::vector<RandomSwitchState::Pointer> _randomStates;

	QString _currentStateVar;

private:
	// no copies
	AnimRandomSwitch(const AnimRandomSwitch&) = delete;
	AnimRandomSwitch& operator=(const AnimRandomSwitch&) = delete;
};

#endif // hifi_AnimRandomSwitch_h
