//
//  AnimContext.cpp
//
//  Created by Anthony J. Thibault on 9/19/16.
//  Copyright (c) 2016 High Fidelity, Inc. All rights reserved.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "AnimContext.h"
#include <QtCore/QThread>
#include "AnimationLogging.h"


AnimContext::AnimContext(bool enableDebugDrawIKTargets, bool enableDebugDrawIKConstraints, bool enableDebugDrawIKChains,
                         const glm::mat4& geometryToRigMatrix, const glm::mat4& rigToWorldMatrix) :
    _enableDebugDrawIKTargets(enableDebugDrawIKTargets),
    _enableDebugDrawIKConstraints(enableDebugDrawIKConstraints),
    _enableDebugDrawIKChains(enableDebugDrawIKChains),
    _geometryToRigMatrix(geometryToRigMatrix),
    _rigToWorldMatrix(rigToWorldMatrix)
{
}

AnimContext& AnimContext::operator=(const AnimContext& other) {
    _enableDebugDrawIKTargets = other._enableDebugDrawIKTargets;
    _enableDebugDrawIKConstraints = other._enableDebugDrawIKConstraints;
    _enableDebugDrawIKChains = other._enableDebugDrawIKChains;
    _geometryToRigMatrix = other._geometryToRigMatrix;
    _rigToWorldMatrix = other._rigToWorldMatrix;
    qCDebug(animation) << "size of the state maching map " << size(_stateMachineMap) << " other " << size(other._stateMachineMap);
    //qCDebug(animation) << "size of the debug alpha map " << size(_debugAlphaMap) << " other " << size(other._debugAlphaMap);
    //QThread::sleep(0.2f);
    _debugAlphaMap = other._debugAlphaMap;
    _stateMachineMap = other._stateMachineMap;

    return *this;
}
