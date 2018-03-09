//
//  Created by Bradley Austin Davis on 2017/04/27
//  Copyright 2013-2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include "MySkeletonModel.h"

#include <avatars-renderer/Avatar.h>
#include <DebugDraw.h>

#include "Application.h"
#include "InterfaceLogging.h"
#include "AnimUtil.h"
#include "tensorflowLibrary.h"

#define USE_TENSORFLOW

#ifdef USE_TENSORFLOW
static graphAction * hipsPredictionGraph;
std::unique_ptr<tensorflow::Session>  session6;
#endif //tensorflow


MySkeletonModel::MySkeletonModel(Avatar* owningAvatar, QObject* parent) : SkeletonModel(owningAvatar, parent) {

#ifdef USE_TENSORFLOW
    hipsPredictionGraph = new graphAction("C:/machinelearning/skcleandir/tempgraphs/my_time_series_model_headhands.bytes", &session6);
    data_hifi = { 0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
                  0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,
        0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f,0.0f };

#endif // USE_TENSORFLOW
}

Rig::CharacterControllerState convertCharacterControllerState(CharacterController::State state) {
    switch (state) {
        default:
        case CharacterController::State::Ground:
            return Rig::CharacterControllerState::Ground;
        case CharacterController::State::Takeoff:
            return Rig::CharacterControllerState::Takeoff;
        case CharacterController::State::InAir:
            return Rig::CharacterControllerState::InAir;
        case CharacterController::State::Hover:
            return Rig::CharacterControllerState::Hover;
    };
}

static AnimPose computeHipsInSensorFrame(MyAvatar* myAvatar, bool isFlying) {
    /*
    float * answer = (*hipsPredictionGraph).getAnswer(&data_hifi[0], &session6);
    qCDebug(interfaceapp) << "return value: " << answer[0] << " " << answer[1] << " " << answer[2] << endl;
    */

    glm::mat4 worldToSensorMat = glm::inverse(myAvatar->getSensorToWorldMatrix());

    // check for pinned hips.
    auto hipsIndex = myAvatar->getJointIndex("Hips");
    if (myAvatar->isJointPinned(hipsIndex)) {
        Transform avatarTransform = myAvatar->getTransform();
        AnimPose result = AnimPose(worldToSensorMat * avatarTransform.getMatrix() * Matrices::Y_180);
        result.scale() = glm::vec3(1.0f, 1.0f, 1.0f);
        return result;
    }

    glm::mat4 hipsMat = myAvatar->deriveBodyFromHMDSensor();
    glm::vec3 hipsPos = extractTranslation(hipsMat);
    glm::quat hipsRot = glmExtractRotation(hipsMat);

    glm::mat4 avatarToWorldMat = myAvatar->getTransform().getMatrix();
    glm::mat4 avatarToSensorMat = worldToSensorMat * avatarToWorldMat;

    // dampen hips rotation, by mixing it with the avatar orientation in sensor space
    const float MIX_RATIO = 0.5f;
    hipsRot = safeLerp(glmExtractRotation(avatarToSensorMat), hipsRot, MIX_RATIO);

    if (isFlying) {
        // rotate the hips back to match the flying animation.

        const float TILT_ANGLE = 0.523f;
        const glm::quat tiltRot = glm::angleAxis(TILT_ANGLE, transformVectorFast(avatarToSensorMat, -Vectors::UNIT_X));

        glm::vec3 headPos;
        int headIndex = myAvatar->getJointIndex("Head");
        if (headIndex != -1) {
            headPos = transformPoint(avatarToSensorMat, myAvatar->getAbsoluteJointTranslationInObjectFrame(headIndex));
        } else {
            headPos = transformPoint(myAvatar->getSensorToWorldMatrix(), myAvatar->getHMDSensorPosition());
        }
        hipsRot = tiltRot * hipsRot;
        hipsPos = headPos + tiltRot * (hipsPos - headPos);
    }

    return AnimPose(hipsRot * Quaternions::Y_180, hipsPos);
}

// Called within Model::simulate call, below.
void MySkeletonModel::updateRig(float deltaTime, glm::mat4 parentTransform) {
    const FBXGeometry& geometry = getFBXGeometry();

    Head* head = _owningAvatar->getHead();

    // make sure lookAt is not too close to face (avoid crosseyes)
    glm::vec3 lookAt = head->getLookAtPosition();
    glm::vec3 focusOffset = lookAt - _owningAvatar->getHead()->getEyePosition();
    float focusDistance = glm::length(focusOffset);
    const float MIN_LOOK_AT_FOCUS_DISTANCE = 1.0f;
    if (focusDistance < MIN_LOOK_AT_FOCUS_DISTANCE && focusDistance > EPSILON) {
        lookAt = _owningAvatar->getHead()->getEyePosition() + (MIN_LOOK_AT_FOCUS_DISTANCE / focusDistance) * focusOffset;
    }

    MyAvatar* myAvatar = static_cast<MyAvatar*>(_owningAvatar);
    assert(myAvatar);

    Rig::ControllerParameters params;

    AnimPose avatarToRigPose(glm::vec3(1.0f), Quaternions::Y_180, glm::vec3(0.0f));

    // input action is the highest priority source for head orientation.
    auto avatarHeadPose = myAvatar->getControllerPoseInAvatarFrame(controller::Action::HEAD);
    if (avatarHeadPose.isValid()) {
        AnimPose pose(avatarHeadPose.getRotation(), avatarHeadPose.getTranslation());
        params.primaryControllerPoses[Rig::PrimaryControllerType_Head] = avatarToRigPose * pose;
        params.primaryControllerFlags[Rig::PrimaryControllerType_Head] = (uint8_t)Rig::ControllerFlags::Enabled;
    } else {
        // even though full head IK is disabled, the rig still needs the head orientation to rotate the head up and
        // down in desktop mode.
        // preMult 180 is necessary to convert from avatar to rig coordinates.
        // postMult 180 is necessary to convert head from -z forward to z forward.
        glm::quat headRot = Quaternions::Y_180 * head->getFinalOrientationInLocalFrame() * Quaternions::Y_180;
        params.primaryControllerPoses[Rig::PrimaryControllerType_Head] = AnimPose(glm::vec3(1.0f), headRot, glm::vec3(0.0f));
        params.primaryControllerFlags[Rig::PrimaryControllerType_Head] = 0;
    }

    //
    // primary controller poses, control IK targets directly.
    //

    static const std::vector<std::pair<controller::Action, Rig::PrimaryControllerType>> primaryControllers = {
        { controller::Action::LEFT_HAND, Rig::PrimaryControllerType_LeftHand },
        { controller::Action::RIGHT_HAND, Rig::PrimaryControllerType_RightHand },
        { controller::Action::HIPS, Rig::PrimaryControllerType_Hips },
        { controller::Action::LEFT_FOOT, Rig::PrimaryControllerType_LeftFoot },
        { controller::Action::RIGHT_FOOT, Rig::PrimaryControllerType_RightFoot },
        { controller::Action::SPINE2, Rig::PrimaryControllerType_Spine2 }
    };

    for (auto pair : primaryControllers) {
        auto controllerPose = myAvatar->getControllerPoseInAvatarFrame(pair.first);
        if (controllerPose.isValid()) {
            AnimPose pose(controllerPose.getRotation(), controllerPose.getTranslation());
            params.primaryControllerPoses[pair.second] = avatarToRigPose * pose;
            params.primaryControllerFlags[pair.second] = (uint8_t)Rig::ControllerFlags::Enabled;
        } else {
            params.primaryControllerPoses[pair.second] = AnimPose::identity;
            params.primaryControllerFlags[pair.second] = 0;
        }
    }

    //
    // secondary controller poses, influence the pose of the skeleton indirectly.
    //

    static const std::vector<std::pair<controller::Action, Rig::SecondaryControllerType>> secondaryControllers = {
        { controller::Action::LEFT_SHOULDER, Rig::SecondaryControllerType_LeftShoulder },
        { controller::Action::RIGHT_SHOULDER, Rig::SecondaryControllerType_RightShoulder },
        { controller::Action::LEFT_ARM, Rig::SecondaryControllerType_LeftArm },
        { controller::Action::RIGHT_ARM, Rig::SecondaryControllerType_RightArm },
        { controller::Action::LEFT_FORE_ARM, Rig::SecondaryControllerType_LeftForeArm },
        { controller::Action::RIGHT_FORE_ARM, Rig::SecondaryControllerType_RightForeArm },
        { controller::Action::LEFT_UP_LEG, Rig::SecondaryControllerType_LeftUpLeg },
        { controller::Action::RIGHT_UP_LEG, Rig::SecondaryControllerType_RightUpLeg },
        { controller::Action::LEFT_LEG, Rig::SecondaryControllerType_LeftLeg },
        { controller::Action::RIGHT_LEG, Rig::SecondaryControllerType_RightLeg },
        { controller::Action::LEFT_TOE_BASE, Rig::SecondaryControllerType_LeftToeBase },
        { controller::Action::RIGHT_TOE_BASE, Rig::SecondaryControllerType_RightToeBase }
    };

    for (auto pair : secondaryControllers) {
        auto controllerPose = myAvatar->getControllerPoseInAvatarFrame(pair.first);
        if (controllerPose.isValid()) {
            AnimPose pose(controllerPose.getRotation(), controllerPose.getTranslation());
            params.secondaryControllerPoses[pair.second] = avatarToRigPose * pose;
            params.secondaryControllerFlags[pair.second] = (uint8_t)Rig::ControllerFlags::Enabled;
        } else {
            params.secondaryControllerPoses[pair.second] = AnimPose::identity;
            params.secondaryControllerFlags[pair.second] = 0;
        }
    }
    
#ifdef USE_TENSORFLOW
    
    if (myAvatar->getHMDLeanRecenterEnabled()) {
        myAvatar->setHMDLeanRecenterEnabled(false);
    }

    auto avatarhead = myAvatar->getControllerPoseInAvatarFrame(controller::Action::HEAD);
    auto avatarsensorhead = myAvatar->getControllerPoseInSensorFrame(controller::Action::HEAD);
    AnimPose hipsSpace = computeHipsInSensorFrame(myAvatar, false);
    qCDebug(interfaceapp) << "hips in sensor Frame " << hipsSpace.rot().x << " " << hipsSpace.rot().y << " " << hipsSpace.rot().z << " " << hipsSpace.rot().w << endl;
    qCDebug(interfaceapp) << "head in sensor Frame " << avatarsensorhead.getRotation().x << " " << avatarsensorhead.getRotation().y << " " << avatarsensorhead.getRotation().z << " " << avatarsensorhead.getRotation().w << endl;
     
    glm::quat hipsSpaceRot = (Quaternions::Y_180)*hipsSpace.rot();

    glm::quat headYawOnly;
    qCDebug(interfaceapp) << "head track values in sensor space: " << avatarsensorhead.getTranslation().x << " " << avatarsensorhead.getTranslation().y << " " << avatarsensorhead.getTranslation().z << endl;
    qCDebug(interfaceapp) << "head track values in avatar space: " << avatarhead.getTranslation().x << " " << avatarhead.getTranslation().y << " " << avatarhead.getTranslation().z << endl;

    if (avatarhead.isValid()) {

        
        glm::vec3 headpostensor_sensor = ((Quaternions::Y_180)*avatarsensorhead.getTranslation())*hipsSpaceRot;
        glm::quat headrottensor = glm::inverse(hipsSpaceRot)*(Quaternions::Y_180)*(avatarsensorhead.getRotation());

        //headYawOnly = cancelOutRollAndPitch(headrottensor);
        headYawOnly = cancelOutRollAndPitch(headrottensor);

        glm::vec3 headpos_scaled = glm::vec3(headpostensor_sensor.x / 1.68f, (1.5f + headpostensor_sensor.y) / 1.68f, headpostensor_sensor.z / 1.68f);


        if (!_prevHeadValid) {
            _prevHead = headpos_scaled;
            _prevHeadValid = true;
        }

        //glm::vec3 headpostensor = avatarsensorhead.getTranslation();
        qCDebug(interfaceapp) << "head track values in hips space: " << headpostensor_sensor.x << " " << headpostensor_sensor.y << " " << headpostensor_sensor.z << endl;
        qCDebug(interfaceapp) << "Scaled sensor head track values: " << headpos_scaled.x << " " << headpos_scaled.y << " " << headpos_scaled.z << endl;

        for (int i = 0; i < 119; i++) {
            for (int j = 0; j < 10; j++) {
                //shift all the rows down in the input tensor.
                data_hifi[j + (i * 10)] = data_hifi[j + ((i + 1) * 10)];
            }
        } 
        data_hifi[(119 * 10) + 0] = headpos_scaled.x - _prevHead.x;
        qCDebug(interfaceapp) << "xoffset " << (headpos_scaled.x - _prevHead.x) << endl;
        data_hifi[(119 * 10) + 1] = (1 - headpos_scaled.y) / -.4f;
        qCDebug(interfaceapp) << "yoffset " << ((1 - headpos_scaled.y) / -.4f) << endl;
        data_hifi[(119 * 10) + 2] = headpos_scaled.z - _prevHead.z;
        qCDebug(interfaceapp) << "zoffset " << (headpos_scaled.z - _prevHead.z) << endl;
        if (headrottensor.w < 0.0f) {
            headrottensor.x = -headrottensor.x;
            headrottensor.y = -headrottensor.y;
            headrottensor.z = -headrottensor.z;
            headrottensor.w = -headrottensor.w;
        }
        data_hifi[(119 * 10) + 3] = headrottensor.x;
        data_hifi[(119 * 10) + 4] = headrottensor.y;
        data_hifi[(119 * 10) + 5] = headrottensor.z;
        data_hifi[(119 * 10) + 6] = (1-headrottensor.w)/.3f;
        data_hifi[(119 * 10) + 7] = _prevPredictionHips.x;
        data_hifi[(119 * 10) + 8] = _prevPredictionHips.y;
        data_hifi[(119 * 10) + 9] = _prevPredictionHips.z;
        _prevHead = headpos_scaled;

        qCDebug(interfaceapp) << "the rest of the input: " << headrottensor.x << " " <<headrottensor.y<< " "<< headrottensor.z << " "<< headrottensor.w << _prevPredictionHips.x << endl;

        //then fill the last row of the input tensor with the latest reads and prediction
    }
    else
    {
        _prevHeadValid = false;
    }

    uint start = GetTickCount();
    float * answer = (*hipsPredictionGraph).getAnswer(&data_hifi[0], &session6,10,3);
    uint timeItTook = GetTickCount() - start;
    qCDebug(interfaceapp) << "The time it took for tensorflow: " << timeItTook << endl;

    float scale_x = ((((answer[1] * .4f) - .4f) +.44f)/.44)*(.1f);
    

    _prevPredictionHips = glm::vec3(answer[0], answer[1], answer[2]);
    qCDebug(interfaceapp) << "return value: " << answer[0] << " " << answer[1] << " " << answer[2] << endl;
    if (_prevHeadValid) {
        // we get rid of X value here. due to my capture bias.
        _predictedOffset = (Quaternions::Y_180)*(glm::vec3(answer[0]*.4f+scale_x, ((answer[1] * .4f) - .4f), (answer[2] * .4f)+.10f))*(glm::inverse(hipsSpaceRot));
        qCDebug(interfaceapp) << "predicted hip offset: " << _predictedOffset.x << " " << _predictedOffset.y << " " << _predictedOffset.z << endl;
    }
#endif //end TENSOR_FLOW 
    // if hips are not under direct control, estimate the hips position.
    if (avatarHeadPose.isValid() && !(params.primaryControllerFlags[Rig::PrimaryControllerType_Hips] & (uint8_t)Rig::ControllerFlags::Enabled)) {
        bool isFlying = (myAvatar->getCharacterController()->getState() == CharacterController::State::Hover || myAvatar->getCharacterController()->computeCollisionGroup() == BULLET_COLLISION_GROUP_COLLISIONLESS);

        if (!_prevHipsValid) {
            AnimPose hips = computeHipsInSensorFrame(myAvatar, isFlying);
            _prevHips = hips;
        }

        AnimPose hips = computeHipsInSensorFrame(myAvatar, isFlying);
#ifdef USE_TENSORFLOW
        //first take the prediction from the model and rotate it back to sensor space
        
        
        //scale based on avatar torso length
        const Rig& rig = getRig();
        int headIndex = rig.indexOfJoint("Head");
        int neckIndex = rig.indexOfJoint("Neck");
        int hipsIndex = rig.indexOfJoint("Hips");

        glm::vec3 rigHeadPos = headIndex != -1 ? rig.getAbsoluteDefaultPose(headIndex).trans() : DEFAULT_AVATAR_HEAD_POS;
        glm::vec3 rigNeckPos = neckIndex != -1 ? rig.getAbsoluteDefaultPose(neckIndex).trans() : DEFAULT_AVATAR_NECK_POS;
        glm::vec3 rigHipsPos = hipsIndex != -1 ? rig.getAbsoluteDefaultPose(hipsIndex).trans() : DEFAULT_AVATAR_HIPS_POS;

        glm::vec3 localHead = (rigHeadPos - rigHipsPos);
        glm::vec3 localNeck = (rigNeckPos - rigHipsPos);

        glm::vec3 torso = localHead + localNeck;
        float avatartorsolength = torso.length();
        float lengthoffset = _predictedOffset.length();

        float scalepredictionratio = (avatartorsolength/lengthoffset)*1.15f;
        qCDebug(interfaceapp) << "scale prediction ratio: " << scalepredictionratio << endl;
        _predictedOffset = _predictedOffset*scalepredictionratio;
        //put predictedoffset back in sensor space
        //_predictedOffset = glm::inverse(hipsSpaceRot)*_predictedOffset;

        glm::quat ident;
        //qCDebug(interfaceapp) << "compute Hips: " << hips.trans().x << " " << hips.trans().y << " " << hips.trans().z << endl;
        glm::mat4 globalhip = createMatFromQuatAndPos(ident, (avatarsensorhead.getTranslation() + _predictedOffset));
        glm::vec3 localhip = hipsSpaceRot*extractTranslation(globalhip);
        AnimPose ph = AnimPose(hipsSpace.rot(), (avatarsensorhead.getTranslation() + _predictedOffset));
        //hips.trans() = ph.trans();// avatarsensorhead.getTranslation() + (_predictedOffset*1.68f);
        qCDebug(interfaceapp) << "Predict Hips: " << _predictedOffset.x*1.68f << " " << _predictedOffset.y*1.68f << " " << _predictedOffset.z*1.68f << endl;
        //float invSensorToWorldScale = getUserEyeHeight() / getEyeHeight();
        //_prevHips = ph;// avatarsensorhead.getTranslation() + (_predictedOffset*1.68f);
        hips = ph;
        _prevHips = ph;

#endif // 

        // smootly lerp hips, in sensorframe, with different coeff for horiz and vertical translation.
        const float ROT_ALPHA = 0.9f;
        const float TRANS_HORIZ_ALPHA = 0.9f;
        const float TRANS_VERT_ALPHA = 0.1f;
        float hipsY = hips.trans().y;

        hips.trans() = lerp(hips.trans(), _prevHips.trans(), TRANS_HORIZ_ALPHA);
        hips.trans().y = lerp(hipsY, _prevHips.trans().y, TRANS_VERT_ALPHA);
        hips.rot() = safeLerp(hips.rot(), _prevHips.rot(), ROT_ALPHA);

        _prevHips = hips;
        _prevHipsValid = true;

        glm::mat4 invRigMat = glm::inverse(myAvatar->getTransform().getMatrix() * Matrices::Y_180);
        AnimPose sensorToRigPose(invRigMat * myAvatar->getSensorToWorldMatrix());
        
        AnimPose temp = sensorToRigPose * hips;
		
#ifdef USE_TENSORFLOW
        temp.trans().z = temp.trans().z;// +.15f;
        AnimPose temp2 = sensorToRigPose * ph;
		qCDebug(interfaceapp) << "Final predicted hip returned: " << ph.trans().x << " " << ph.trans().y << " " << ph.trans().z;
        qCDebug(interfaceapp) << "Final predicted position rig space: " << temp2.trans().x << " " << temp2.trans().y << " " << temp2.trans().z;

#endif
        qCDebug(interfaceapp) << "Final compute hip returned: " << hips.trans().x << " " <<hips.trans().y << " " << hips.trans().z;
        qCDebug(interfaceapp) << "Final hip position rig space: " << temp.trans().x << " " << temp.trans().y << " " << temp.trans().z;

        params.primaryControllerPoses[Rig::PrimaryControllerType_Hips] =  temp;
        params.primaryControllerFlags[Rig::PrimaryControllerType_Hips] = (uint8_t)Rig::ControllerFlags::Enabled | (uint8_t)Rig::ControllerFlags::Estimated;

    } else {
        _prevHipsValid = false;
    } 

    params.isTalking = head->getTimeWithoutTalking() <= 1.5f;

    // pass detailed torso k-dops to rig.
    int hipsJoint = _rig.indexOfJoint("Hips");
    if (hipsJoint >= 0) {
        params.hipsShapeInfo = geometry.joints[hipsJoint].shapeInfo;
    }
    int spineJoint = _rig.indexOfJoint("Spine");
    if (spineJoint >= 0) {
        params.spineShapeInfo = geometry.joints[spineJoint].shapeInfo;
    }
    int spine1Joint = _rig.indexOfJoint("Spine1");
    if (spine1Joint >= 0) {
        params.spine1ShapeInfo = geometry.joints[spine1Joint].shapeInfo;
    }
    int spine2Joint = _rig.indexOfJoint("Spine2");
    if (spine2Joint >= 0) {
        params.spine2ShapeInfo = geometry.joints[spine2Joint].shapeInfo;
    }

    _rig.updateFromControllerParameters(params, deltaTime);

    Rig::CharacterControllerState ccState = convertCharacterControllerState(myAvatar->getCharacterController()->getState());

    auto velocity = myAvatar->getLocalVelocity() / myAvatar->getSensorToWorldScale();
    auto position = myAvatar->getLocalPosition();
    auto orientation = myAvatar->getLocalOrientation();
    _rig.computeMotionAnimationState(deltaTime, position, velocity, orientation, ccState);

    // evaluate AnimGraph animation and update jointStates.
    Model::updateRig(deltaTime, parentTransform);

    Rig::EyeParameters eyeParams;
    eyeParams.eyeLookAt = lookAt;
    eyeParams.eyeSaccade = head->getSaccade();
    eyeParams.modelRotation = getRotation();
    eyeParams.modelTranslation = getTranslation();
    eyeParams.leftEyeJointIndex = geometry.leftEyeJointIndex;
    eyeParams.rightEyeJointIndex = geometry.rightEyeJointIndex;

    _rig.updateFromEyeParameters(eyeParams);

    updateFingers();
}


void MySkeletonModel::updateFingers() {

    MyAvatar* myAvatar = static_cast<MyAvatar*>(_owningAvatar);

    static std::vector<std::vector<std::pair<controller::Action, QString>>> fingerChains = {
        {
            { controller::Action::LEFT_HAND, "LeftHand" },
            { controller::Action::LEFT_HAND_THUMB1, "LeftHandThumb1" },
            { controller::Action::LEFT_HAND_THUMB2, "LeftHandThumb2" },
            { controller::Action::LEFT_HAND_THUMB3, "LeftHandThumb3" },
            { controller::Action::LEFT_HAND_THUMB4, "LeftHandThumb4" }
        },
        {
            { controller::Action::LEFT_HAND, "LeftHand" },
            { controller::Action::LEFT_HAND_INDEX1, "LeftHandIndex1" },
            { controller::Action::LEFT_HAND_INDEX2, "LeftHandIndex2" },
            { controller::Action::LEFT_HAND_INDEX3, "LeftHandIndex3" },
            { controller::Action::LEFT_HAND_INDEX4, "LeftHandIndex4" }
        },
        {
            { controller::Action::LEFT_HAND, "LeftHand" },
            { controller::Action::LEFT_HAND_MIDDLE1, "LeftHandMiddle1" },
            { controller::Action::LEFT_HAND_MIDDLE2, "LeftHandMiddle2" },
            { controller::Action::LEFT_HAND_MIDDLE3, "LeftHandMiddle3" },
            { controller::Action::LEFT_HAND_MIDDLE4, "LeftHandMiddle4" }
        },
        {
            { controller::Action::LEFT_HAND, "LeftHand" },
            { controller::Action::LEFT_HAND_RING1, "LeftHandRing1" },
            { controller::Action::LEFT_HAND_RING2, "LeftHandRing2" },
            { controller::Action::LEFT_HAND_RING3, "LeftHandRing3" },
            { controller::Action::LEFT_HAND_RING4, "LeftHandRing4" }
        },
        {
            { controller::Action::LEFT_HAND, "LeftHand" },
            { controller::Action::LEFT_HAND_PINKY1, "LeftHandPinky1" },
            { controller::Action::LEFT_HAND_PINKY2, "LeftHandPinky2" },
            { controller::Action::LEFT_HAND_PINKY3, "LeftHandPinky3" },
            { controller::Action::LEFT_HAND_PINKY4, "LeftHandPinky4" }
        },
        {
            { controller::Action::RIGHT_HAND, "RightHand" },
            { controller::Action::RIGHT_HAND_THUMB1, "RightHandThumb1" },
            { controller::Action::RIGHT_HAND_THUMB2, "RightHandThumb2" },
            { controller::Action::RIGHT_HAND_THUMB3, "RightHandThumb3" },
            { controller::Action::RIGHT_HAND_THUMB4, "RightHandThumb4" }
        },
        {
            { controller::Action::RIGHT_HAND, "RightHand" },
            { controller::Action::RIGHT_HAND_INDEX1, "RightHandIndex1" },
            { controller::Action::RIGHT_HAND_INDEX2, "RightHandIndex2" },
            { controller::Action::RIGHT_HAND_INDEX3, "RightHandIndex3" },
            { controller::Action::RIGHT_HAND_INDEX4, "RightHandIndex4" }
        },
        {
            { controller::Action::RIGHT_HAND, "RightHand" },
            { controller::Action::RIGHT_HAND_MIDDLE1, "RightHandMiddle1" },
            { controller::Action::RIGHT_HAND_MIDDLE2, "RightHandMiddle2" },
            { controller::Action::RIGHT_HAND_MIDDLE3, "RightHandMiddle3" },
            { controller::Action::RIGHT_HAND_MIDDLE4, "RightHandMiddle4" }
        },
        {
            { controller::Action::RIGHT_HAND, "RightHand" },
            { controller::Action::RIGHT_HAND_RING1, "RightHandRing1" },
            { controller::Action::RIGHT_HAND_RING2, "RightHandRing2" },
            { controller::Action::RIGHT_HAND_RING3, "RightHandRing3" },
            { controller::Action::RIGHT_HAND_RING4, "RightHandRing4" }
        },
        {
            { controller::Action::RIGHT_HAND, "RightHand" },
            { controller::Action::RIGHT_HAND_PINKY1, "RightHandPinky1" },
            { controller::Action::RIGHT_HAND_PINKY2, "RightHandPinky2" },
            { controller::Action::RIGHT_HAND_PINKY3, "RightHandPinky3" },
            { controller::Action::RIGHT_HAND_PINKY4, "RightHandPinky4" }
        }
    };

    const float CONTROLLER_PRIORITY = 2.0f;

    for (auto& chain : fingerChains) {
        glm::quat prevAbsRot = Quaternions::IDENTITY;
        for (auto& link : chain) {
            int index = _rig.indexOfJoint(link.second);
            if (index >= 0) {
                auto rotationFrameOffset = _jointRotationFrameOffsetMap.find(index);
                if (rotationFrameOffset == _jointRotationFrameOffsetMap.end()) {
                    _jointRotationFrameOffsetMap.insert(std::pair<int, int>(index, 0));
                    rotationFrameOffset = _jointRotationFrameOffsetMap.find(index);
                }
                auto pose = myAvatar->getControllerPoseInSensorFrame(link.first);
                
                if (pose.valid) {
                    glm::quat relRot = glm::inverse(prevAbsRot) * pose.getRotation();
                    // only set the rotation for the finger joints, not the hands.
                    if (link.first != controller::Action::LEFT_HAND && link.first != controller::Action::RIGHT_HAND) {
                        _rig.setJointRotation(index, true, relRot, CONTROLLER_PRIORITY);
                        rotationFrameOffset->second = 0;
                    }
                    prevAbsRot = pose.getRotation();
                } else if (rotationFrameOffset->second == 1) { // if the pose is invalid and was set on previous frame we do clear ( current frame offset = 1 )
                    _rig.clearJointAnimationPriority(index);
                }
                rotationFrameOffset->second++;
            }
        }
    }
}
