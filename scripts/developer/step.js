/* jslint bitwise: true */

/* global Script, Vec3, MyAvatar, Tablet, Messages, Quat, DebugDraw, Mat4, Entities, Xform, Controller, Camera, console, document*/

Script.registerValue("STEPAPP", true);

var LEFT = 0;
var RIGHT = 1;
var DEFAULT_AVATAR_HEIGHT = 1.64;
var TABLET_BUTTON_NAME = "STEP";
var CHANGE_OF_BASIS_ROTATION = { x: 0, y: 1, z: 0, w: 0 };
// in centimeters
var DEFAULT_ANTERIOR = 0.14;
var DEFAULT_POSTERIOR = 0.14;
var DEFAULT_LATERAL = 0.10;
var DEFAULT_HEIGHT_DIFFERENCE = -0.01;
// zero to ten
var DEFAULT_ANGULAR_VELOCITY = 0.3;
var DEFAULT_HAND_VELOCITY = -1.0;
var DEFAULT_ANGULAR_HAND_VELOCITY = 0.3;
var VELOCITY_EPSILON = 0.00001;
var ROT_Y180 = {x: 0, y: 1, z: 0, w: 0};
var MAX_LEVEL_PITCH = 3;                        
var MAX_LEVEL_ROLL = 3;
//  this should be changed by the actual base of support of the person? or Avatar?
//  You must have moved at least this far laterally to take a step
var MIN_STEP_DISTANCE = 0.03;
var DONE_STEPPING_DISTANCE = 0.01;
var AVERAGING_RATE = 0.02;
var HEIGHT_AVERAGING_RATE = 0.0025;
//  The velocity of head and hands in same direction that triggers stepping
var STEP_VELOCITY_THRESHOLD = 0.05;
//  The time required for observed velocity to continue to trigger stepping
var STEP_TIME_SECS = 0.15;

var AZIMUTH_TURN_MIN_DEGREES = 22;
var AZIMUTH_TIME_SECS = 2.5;
var HEAD_HAND_BALANCE = 2.0;

var RECENTER = false;
MyAvatar.hmdLeanRecenterEnabled = RECENTER;
var STEPTURN = true;
var RESET_MODE = false;

var MY_HEIGHT = 1.15;


var maxHeightChange = 0.010;
var angularVelocityThreshold = 0.3;         
var handVelocityThreshold = -1.0;
var handAngularVelocityThreshold = 0.3;
var lateralEdge = 0.14;
var frontEdge = -0.10;
var backEdge = 0.13;
var frontLeft = { x: -lateralEdge, y: 0, z: frontEdge };
var frontRight = { x: lateralEdge, y: 0, z: frontEdge };
var backLeft = { x: -lateralEdge, y: 0, z: backEdge };
var backRight = { x: lateralEdge, y: 0, z: backEdge };

var overFront = false;
var overBack = false;
var overLateral = false;

var modeArray = new Array(100);
var modeHeight = -10.0;
var stepTimer = -1.0;
var stationaryTimer = 0.0;
var heightFudgeFactor = 0.01;
var torsoLength = 1.0;
var defaultLength = 1.0;
var hipsRotation = {x: 0, y: 0, z: 0, w: 1};
var hipsPosition = {x: 0, y: 0, z: 0};
var spine2Rotation = {x: 0, y: -0.85, z: 0, w: 0.5};
var spine2Position = { x: 0, y: 0, z: 0 };
var handDotHead = [];
var headPosition;
var headAverageOrientation = MyAvatar.orientation;
var headPoseAverageOrientation = { x: 0, y: 0, z: 0, w: 1 };
var averageHeight = 1.0;
var handPosition;
var handOrientation;
var headOrientation;
var isStepping = false;
var handSteppingDetect = false;
var handSteppingTimer = 0;
var lastHeadAzimuth = 0;
var azimuthChangeTimer = 0;
var hipToHandAverage = [];
var averageAzimuth = 0.0;
var headPosAvatarSpace;
var rightHandPosAvatarSpace;
var leftHandPosAvatarSpace; 
var hands = [];
var head, headAverage;
var headEulers;
var headAverageEulers;
var oldAngularVelocity = { x: 0.0, y: 0.0, z: 0.0 };
var headSwayCount = 0;
var accelerationArray = new Array(30);
var debugDrawBase = true;
var activated = false;
var documentLoaded = false;

var HTML_URL = Script.resolvePath("file:///c:/angus/javascript/stepApp.html");
var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

function manageClick() {
    if (activated) {
        tablet.gotoHomeScreen();
    } else {
        tablet.gotoWebScreen(HTML_URL);
    }
}

var tabletButton = tablet.addButton({
    text: TABLET_BUTTON_NAME,
    icon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/step2.svg"),
    activeIcon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/step2.svg")
});

function drawBase() {
    // transform corners into world space, for rendering.
    // var avatarXform = new Xform(MyAvatar.orientation, MyAvatar.position);
    var worldPointLf = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, frontLeft));
    var worldPointRf = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, frontRight));
    var worldPointLb = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, backLeft));
    var worldPointRb = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, backRight));
    
    // print("world point is left front is: " + worldPointLf.x + " " + worldPointLf.y + " " + worldPointLf.z);
    // print("front left point is " + frontLeft.x + " " + frontLeft.y + " " + frontLeft.z);

    var GREEN = { r: 0, g: 1, b: 0, a: 1 };
    
    // draw border
    DebugDraw.drawRay(worldPointLf, worldPointRf, GREEN);
    DebugDraw.drawRay(worldPointRf, worldPointRb, GREEN);
    DebugDraw.drawRay(worldPointRb, worldPointLb, GREEN);
    DebugDraw.drawRay(worldPointLb, worldPointLf, GREEN);
}

function onKeyPress(event) {
    if (event.text === "'") {
        // when the sensors are reset, then reset the mode.
        RESET_MODE = false;
    }
}

function onWebEventReceived(msg) {
    var message = JSON.parse(msg);
    print(" we have a message from html dialog " + message.type);
    switch (message.type) {
        case "onAnteriorBaseSlider":
            print("anterior slider " + message.data.value);
            setAnteriorDistance(message.data.value / 100.0);
            break;
        case "onPosteriorBaseSlider":
            print("posterior slider " + message.data.value);
            setPosteriorDistance(message.data.value / 100.0);
            break;
        case "onLateralBaseSlider":
            print("lateral slider " + message.data.value);
            setLateralDistance(message.data.value / 100.0);
            break;
        case "onAngularVelocitySlider":
            print("angular velocity value " + message.data.value);
            setAngularThreshold((10.0 - message.data.value) / 10.0);
            break;
        case "onHeightDifferenceSlider":
            print("height slider " + message.data.value);
            setHeightThreshold(-(message.data.value / 100.0));
            break;
        case "onHandsVelocitySlider":
            print("hands velocity slider " + message.data.value);
            setHandVelocityThreshold(message.data.value / 10.0);
            break;
        case "onHandsAngularVelocitySlider":
            print("hands angular velocity slider " + message.data.value);
            setHandAngularVelocityThreshold((10.0 - message.data.value) / 10.0);
            break;
        case "onCreateStepApp":
            print("on create step app ");
            break;
        default:
            print("unknown message from step html!!");
            break;
    }
}

function onScreenChanged(type, url) {     
    print("Screen changed");
    if (type === "Web" && url === HTML_URL) {
        if (!activated) {
            // hook up to event bridge
            tablet.webEventReceived.connect(onWebEventReceived);
            print("after connect web event");
            Script.setTimeout(function() {
                print("step app is loaded: " + documentLoaded);
                tablet.emitScriptEvent(JSON.stringify({ "type": "frontBase", "data": { "value": 1.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "backBase", "data": { "value": 2.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "lateralBase", "data": { "value": 3.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "angularHeadVelocity", "data": { "value": 0.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "heightDifference", "data": { "value": 2.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "handsVelocity", "data": { "value": 1.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "handsAngularVelocity", "data": { "value": 0.0 } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger","id":"frontSignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "lateralSignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "angularHeadSignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "heightSignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "handVelocitySignal", "data": { "value": "green" } }));
                tablet.emitScriptEvent(JSON.stringify({ "type": "trigger","id": "handAngularSignal", "data": { "value": "green" } }));
            }, 500);
        }
        activated = true;
    } else {
        if (activated) {
            setHandAngularVelocityThreshold(DEFAULT_ANGULAR_HAND_VELOCITY);
            setHandVelocityThreshold(DEFAULT_HAND_VELOCITY);
            setHeightThreshold(DEFAULT_HEIGHT_DIFFERENCE);
            setAnteriorDistance(DEFAULT_ANTERIOR);
            setPosteriorDistance(DEFAULT_POSTERIOR);
            setLateralDistance(DEFAULT_LATERAL);
            setAngularThreshold(DEFAULT_ANGULAR_VELOCITY);
            // disconnect from event bridge
            tablet.webEventReceived.disconnect(onWebEventReceived);
        }
        activated = false;
    }
}

function isInsideLine(a, b, c) {
    return (((b.x - a.x)*(c.z - a.z) - (b.z - a.z)*(c.x - a.x)) > 0);
}

function setAngularThreshold(num) {
    angularVelocityThreshold = num;
    print("angular threshold " + angularVelocityThreshold);
}

function setHeightThreshold(num) {
    maxHeightChange = num;
    print("height threshold " + maxHeightChange);
}

function setLateralDistance(num) {
    lateralEdge = num;
    frontLeft.x = -lateralEdge;
    frontRight.x = lateralEdge;
    backLeft.x = -lateralEdge;
    backRight.x = lateralEdge;
    print("lateral distance  " + lateralEdge);
}

function setAnteriorDistance(num) {
    frontEdge = num;
    frontLeft.z = -frontEdge;
    frontRight.z = -frontEdge;
    print("anterior distance " + frontEdge);
}

function setPosteriorDistance(num) {
    backEdge = num;
    backLeft.z = backEdge;
    backRight.z = backEdge;
    print("posterior distance " + frontEdge);
}

function setHandAngularVelocityThreshold(num) {
    handAngularVelocityThreshold = num;
    print("hand angular velocity threshold " + handAngularVelocityThreshold);
}

function setHandVelocityThreshold(num) {
    handVelocityThreshold = num;
    print("hand velocity threshold " + handVelocityThreshold);
}

function withinBaseOfSupport(pos) {
    var userScale = 1.0;
    overFront = !(isInsideLine(Vec3.multiply(userScale, frontLeft), Vec3.multiply(userScale, frontRight), pos));
    overBack = !(isInsideLine(Vec3.multiply(userScale, backRight), Vec3.multiply(userScale, backLeft), pos));
    overLateral = !(isInsideLine(Vec3.multiply(userScale, frontRight), Vec3.multiply(userScale, backRight), pos) && isInsideLine(Vec3.multiply(userScale, backLeft), Vec3.multiply(userScale, frontLeft), pos));
    return (!overFront && !overBack && !overLateral);
}

function getStationaryFudgeFactor() {
    // if no translation for 30 seconds then we raise the bar for translating by 1cm
    var percentStationary = stationaryTimer / 30.0;
    if (percentStationary > 1.0) {
        percentStationary = 1.0;
    }
    return percentStationary * heightFudgeFactor;
}


function limitAngle(angle) {
    return (angle + 180) % 360 - 180;
}

function findAverage(arr) {
    var sum = arr.reduce(function (acc, val) {
        return acc + val;
    },0);
    return sum / arr.length;
}

function addToAccelerationArray(arr, num) {
    for (var i = 0 ; i < (arr.length - 1) ; i++) {
        arr[i] = arr[i + 1];
    }
    arr[arr.length - 1] = num;
}

function addToModeArray(arr,num) {
    for (var i = 0 ;i < (arr.length - 1); i++) {
        arr[i] = arr[i+1];
    }
    arr[arr.length - 1] = (Math.floor(num*100))/100.00;
}

function findMode(ary, currentMode, backLength, defaultBack, currentHeight) {
    var numMapping = {};
    var greatestFreq = 0;
    var mode;
    ary.forEach(function (number) {
        numMapping[number] = (numMapping[number] || 0) + 1;
        if ((greatestFreq < numMapping[number]) || ((numMapping[number] === 100) && (number > currentMode) )) {
            greatestFreq = numMapping[number];
            mode = number;
        }
    });
    if (mode > currentMode) {
        return Number(mode);    
    } else {
        if ((backLength > (defaultBack + 0.10)) || (!RESET_MODE && HMD.active)) {
            print("resetting the mode....................default " + defaultBack + " head-origin " + backLength);
            print("resetting the mode............................................. ");
            print("resetting the mode............................................. ");
            RESET_MODE = true;
            // MyAvatar.triggerHorizontalRecenter();
            // stepTimer = 0.6;
            stationaryTimer = 0.0;
            return currentHeight - 0.02;
        } else {
            return currentMode; 
        }
    }    
}

function update(dt) {
    if (debugDrawBase) {
        drawBase();
    }
    var currentHeadPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
    var defaultHipsPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
    var defaultHeadPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
    defaultLength = Vec3.length(Vec3.subtract(defaultHeadPos, defaultHipsPos));
    var headMinusHipLean = Vec3.subtract(currentHeadPos,defaultHipsPos);
    torsoLength = Vec3.length(headMinusHipLean);

    
    //  Update head information
    var headPose = Controller.getPoseValue(Controller.Standard.Head);
    var rightHandPose = Controller.getPoseValue(Controller.Standard.RightHand);
    var leftHandPose = Controller.getPoseValue(Controller.Standard.LeftHand);
    var headPoseRigSpace = Quat.multiply(CHANGE_OF_BASIS_ROTATION, headPose.rotation);
    headPosition = Camera.getPosition();
    headOrientation = Camera.getOrientation();
    headEulers = Quat.safeEulerAngles(headOrientation);
    headAverageOrientation = Quat.slerp(headAverageOrientation, headOrientation, AVERAGING_RATE);
    headAverageEulers = Quat.safeEulerAngles(headAverageOrientation);
    headPoseAverageOrientation = Quat.slerp(headPoseAverageOrientation, headPoseRigSpace, AVERAGING_RATE);
    var headPoseAverageEulers = Quat.safeEulerAngles(headPoseAverageOrientation);
    // print("head pose average orientation " + headPose.rotation.x + " " + headPose.rotation.y + " " + headPose.rotation.z + " " + headPose.rotation.w);
    // print("head pose average rig space orientation " + headPoseRigSpace.x + " " + headPoseRigSpace.y + " " + headPoseRigSpace.z + " " + headPoseRigSpace.w);
    // print("head pose average yaw " + headPoseAverageEulers.y);
    var azimuth = headEulers.y;
    if (!lastHeadAzimuth) {
        lastHeadAzimuth = azimuth;
    }

    //  head position in object space
    headPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
    rightHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("RightHand"));
    leftHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("LeftHand"));
    var inSupport = withinBaseOfSupport(headPosAvatarSpace);
    
    addToModeArray(modeArray,headPose.translation.y);
    modeHeight = findMode(modeArray, modeHeight, torsoLength, defaultLength, headPose.translation.y);
    var xzAngularVelocity = Vec3.length({ x: headPose.angularVelocity.x, y: 0.0, z: headPose.angularVelocity.z });
    var xzRHandAngularVelocity = Vec3.length({ x: rightHandPose.angularVelocity.x, y: 0.0, z: rightHandPose.angularVelocity.z });
    var xzLHandAngularVelocity = Vec3.length({ x: leftHandPose.angularVelocity.x, y: 0.0, z: leftHandPose.angularVelocity.z });
    var isHeadLevel = (Math.abs(headEulers.z - headAverageEulers.z) < MAX_LEVEL_ROLL)
        && (Math.abs(headEulers.x - headAverageEulers.x) < MAX_LEVEL_PITCH);
    console.log("console right hand angular velocity " + xzRHandAngularVelocity);

    var heightDifferenceFromAverage = modeHeight - headPose.translation.y;

    // Get the hands velocity relative to the head
    // and the hand to hip vector to determine when to change head rotation. 
    for (var hand = LEFT; hand <= RIGHT; hand++) {
        //  Update hand object 
        var pose = Controller.getPoseValue((hand === 1) ? Controller.Standard.RightHand : Controller.Standard.LeftHand);
        var lateralPoseVelocity = {x:0, y:0, z:0};
        if (pose.valid && headPose.valid) {
            lateralPoseVelocity = pose.velocity;
            lateralPoseVelocity.y = 0;
            var lateralHeadVelocity = headPose.velocity;
            lateralHeadVelocity.y = 0;
            handDotHead[hand] = Vec3.dot(Vec3.normalize(lateralPoseVelocity), Vec3.normalize(lateralHeadVelocity));
        }

        //  handPosition = Mat4.transformPoint(avatarToWorldMatrix, pose.translation);
        handPosition = (hand === 1) ? rightHandPosAvatarSpace : leftHandPosAvatarSpace;
        handOrientation = Quat.multiply(MyAvatar.orientation, pose.rotation);
        //  Update angle from hips to hand, to be used for turning 
        var hipToHand = Quat.lookAtSimple({ x: 0, y: 0, z: 0 }, { x: handPosition.x, y: 0, z: handPosition.z });
        hipToHandAverage[hand] = Quat.slerp(hipToHandAverage[hand], hipToHand, AVERAGING_RATE);
    }

    // if we are outside the support base in one direction we get a green light to translate
    if (!inSupport) {
        if (overFront) {
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "frontSignal", "data": { "value": "green" } }));
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "blue" } }));
        } else if (overBack) {
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "green" } }));
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "frontSignal", "data": { "value": "blue" } }));
        } else {
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "blue" } }));
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "frontSignal", "data": { "value": "blue" } }));
        }
        if (overLateral) {
            // over lateral
            tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "green" } }));
        }
    } else {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "frontSignal", "data": { "value": "red" } }));
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "backSignal", "data": { "value": "red" } }));
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "lateralSignal", "data": { "value": "red" } }));
    }

    // if we have too much angular velocity, thus triggering this break on translation.
    if (!(xzAngularVelocity < angularVelocityThreshold)) {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "angularHeadSignal", "data": { "value": "red" } }));
    } else {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "angularHeadSignal", "data": { "value": "green" } }));
    }

    // if we are lower than the height tolerance relative to the height mode
    if (!(heightDifferenceFromAverage < maxHeightChange)) {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "heightSignal", "data": { "value": "red" } }));
    } else {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "heightSignal", "data": { "value": "green" } }));
    }

    // if both hand poses are valid but not matching the direction of the head more than our handVelocityThreshold
    if (!(((!leftHandPose.valid || (handDotHead[LEFT] > handVelocityThreshold)) && (Vec3.length(leftHandPose.velocity) > VELOCITY_EPSILON))
      && ((!rightHandPose.valid || (handDotHead[RIGHT] > handVelocityThreshold)) && (Vec3.length(rightHandPose.velocity) > VELOCITY_EPSILON)))) { 
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "handVelocitySignal", "data": { "value": "red" } }));
    } else {
        // otherwise we are not blocked from translating
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "handVelocitySignal", "data": { "value": "green" } }));
    }

    // if the hand angular velocity for both hands is not lower than the threshold
    if (!((xzRHandAngularVelocity < handAngularVelocityThreshold) && (xzLHandAngularVelocity < handAngularVelocityThreshold))) {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "handAngularSignal", "data": { "value": "red" } }));
    } else {
        tablet.emitScriptEvent(JSON.stringify({ "type": "trigger", "id": "handAngularSignal", "data": { "value": "green" } }));
    }


    //  are we off the base of support, losing height and tilting the head 
    // 1. off the base of support. 2) head is not rotating too much 3) head hasn't lost too much height  4) hands are not still.
    // then we can translate
    // to do: add in -->  -getStationaryFudgeFactor()
    // && (xzAngularVelocity < angularVelocityThreshold)
    if ( !inSupport && (heightDifferenceFromAverage < maxHeightChange)) {
        // && ((!leftHandPose.valid || (handDotHead[LEFT] > handVelocityThreshold)) && (Vec3.length(leftHandPose.velocity) > VELOCITY_EPSILON)) 
        // && ((!rightHandPose.valid || (handDotHead[RIGHT] > handVelocityThreshold)) && (Vec3.length(rightHandPose.velocity) > VELOCITY_EPSILON))
        // && (xzRHandAngularVelocity < handAngularVelocityThreshold) && (xzLHandAngularVelocity < handAngularVelocityThreshold)) {

        if (STEPTURN && (stepTimer < 0.0)) {
            print("trigger recenter========================================================");
            MyAvatar.triggerHorizontalRecenter();
            stepTimer = 0.6;
            stationaryTimer = 0.0;
        }
    }
    stepTimer -= dt;
    stationaryTimer += dt;
    if (!HMD.active) {
        RESET_MODE = false;
    }

    // advance the timer for turning
    var leftRightMidpoint = (Quat.safeEulerAngles(hipToHandAverage[LEFT]).y + Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y) / 2.0;
    if ((headPosition.y - modeHeight) > -0.02) {
        averageAzimuth = leftRightMidpoint * (0.01) + averageAzimuth * (0.99);
        hipsRotation = Quat.angleAxis(averageAzimuth, { x: 0, y: 1, z: 0 });
    }  
    if (Math.abs(leftRightMidpoint) > 20) {
        if (Math.abs(leftRightMidpoint) > 60) {
            azimuthChangeTimer += 2 * dt;
        } else {
            azimuthChangeTimer += dt;
        }
    } else {
        azimuthChangeTimer = 0;
    }
        
    // if (azimuthChangeTimer > AZIMUTH_TIME_SECS) {
    if (Math.abs(headPoseAverageEulers.y) > 25.0) {
        //  Turn feet
        if (STEPTURN) {
            MyAvatar.triggerRotationRecenter();
            headPoseAverageOrientation = { x: 0, y: 0, z: 0, w: 1 };
        }
        // lastHeadAzimuth = averageAzimuth;
        // azimuthChangeTimer = 0;
    }  
}
    
function shutdownTabletApp() {
    // GlobalDebugger.stop();
    tablet.removeButton(tabletButton);
    if (activated) {
        tablet.webEventReceived.disconnect(onWebEventReceived);
        tablet.gotoHomeScreen();
    }
    tablet.screenChanged.disconnect(onScreenChanged);
}

tabletButton.clicked.connect(manageClick);
tablet.screenChanged.connect(onScreenChanged);

Script.update.connect(update);
Controller.keyPressEvent.connect(onKeyPress);
Script.scriptEnding.connect(function () {
    Script.update.disconnect(update);
    shutdownTabletApp();
});
