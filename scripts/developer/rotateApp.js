/* global Script, Vec3, MyAvatar, Tablet, Messages, Quat, 
DebugDraw, Mat4, Entities, Xform, Controller, Camera, console, document*/

Script.registerValue("ROTATEAPP", true);

var TABLET_BUTTON_NAME = "ROTATE";
var CHANGE_OF_BASIS_ROTATION = { x: 0, y: 1, z: 0, w: 0 };
var HEAD_TURN_THRESHOLD = 25.0;
var LOADING_DELAY = 500;
var AVERAGING_RATE = 0.03;

var activated = false;
var documentLoaded = false;
var headPoseAverageOrientation = { x: 0, y: 0, z: 0, w: 1 };
var hipToLeftHandAverage = { x: 0, y: 0, z: 0, w: 1 };
var hipToRightHandAverage = { x: 0, y: 0, z: 0, w: 1 };
var spine2Rotation = { x: 0, y: 0, z: 0, w: 1 };
var averageAzimuth = 0.0;

var ANIM_VARS = [
    // "headType",
    // "spine2Type",
    // "hipsType",
    // "spine2Position",
    "spine2Rotation"
    // "hipsPosition",
    // "hipsRotation"
];

var handlerId = MyAvatar.addAnimationStateHandler(function (props) {

    var result = {};
    // result.headType = ikTypes.HmdHead;
    // result.hipsType = props.hipsType;
    // result.hipsPosition = props.hipsPosition;
    // result.hipsRotation = props.hipsRotation;
    // result.spine2Type = props.hipsType;
    result.spine2Position = spine2Rotation;
    // result.spine2Rotation = props.hipsRotation;
    return result;
}, ANIM_VARS);

// define state readings constructor
function StateReading(headPose, rhandPose, lhandPose, diffFromAverageEulers) {
    this.headPose = headPose;
    this.rhandPose = rhandPose;
    this.lhandPose = lhandPose;
    this.diffFromAverageEulers = diffFromAverageEulers;
}

// define current state readings object for holding tracker readings and current differences from averages
var currentStateReadings = new StateReading(Controller.getPoseValue(Controller.Standard.Head),
    Controller.getPoseValue(Controller.Standard.RightHand), 
    Controller.getPoseValue(Controller.Standard.LeftHand),
    { x: 0, y: 0, z: 0 });
    
// declare the checkbox constructor
function AppCheckbox(type,id,eventType,isChecked) {
    this.type = type;
    this.id = id;
    this.eventType = eventType;
    this.data = {value: isChecked};
}

// declare the html slider constructor
function AppProperty(name, type, eventType, signalType, setFunction, initValue, convertToThreshold, convertToSlider, signalOn) {
    this.name = name;
    this.type = type;
    this.eventType = eventType;
    this.signalType = signalType;
    this.setValue = setFunction;
    this.value = initValue;
    this.get = function () {
        return this.value;
    };
    this.convertToThreshold = convertToThreshold;
    this.convertToSlider = convertToSlider;
}

var HTML_URL = Script.resolvePath("file:///c:/dev/high fidelity/hifi/scripts/developer/stepAppExtra.html");
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
    icon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/foot.svg"),
    activeIcon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/foot.svg")
});

function onKeyPress(event) {
    if (event.text === "'") {
        // when the sensors are reset, then reset the mode.
    }
}
/*
function onWebEventReceived(msg) {
    var message = JSON.parse(msg);
    print(" we have a message from html dialog " + message.type);
    propArray.forEach(function (prop) {
        if (prop.eventType === message.type) {
            prop.setValue(prop.convertToThreshold(message.data.value));
            print("message from " + prop.name);
            // break;
        }
    });
    checkBoxArray.forEach(function(cbox) {
        if (cbox.eventType === message.type) {
            cbox.data.value = message.data.value;
            // break;
        }
    });
}

function initAppForm() {
    print("step app is loaded: " + documentLoaded);
    propArray.forEach(function (prop) {
        print(prop.name);
        tablet.emitScriptEvent(JSON.stringify({
            "type": "trigger",
            "id": prop.signalType,
            "data": { "value": "green" }
        }));
        tablet.emitScriptEvent(JSON.stringify({
            "type": "slider",
            "id": prop.name,
            "data": { "value": prop.convertToSlider(prop.value) }
        }));
    });
    checkBoxArray.forEach(function(cbox) {
        tablet.emitScriptEvent(JSON.stringify({
            "type": "checkboxtick",
            "id": cbox.id,
            "data": { value: cbox.data.value }
        }));
    });
 
}


function onScreenChanged(type, url) {     
    print("Screen changed");
    if (type === "Web" && url === HTML_URL) {
        if (!activated) {
            // hook up to event bridge
            tablet.webEventReceived.connect(onWebEventReceived);
            print("after connect web event");
            MyAvatar.hmdLeanRecenterEnabled = false;
            Script.setTimeout(initAppForm, LOADING_DELAY);
        }
        activated = true;
    } else {
        if (activated) {
            // disconnect from event bridge
            tablet.webEventReceived.disconnect(onWebEventReceived);
        }
        activated = false;
    }
}
*/
function update(dt) {

    //  Update head information
    currentStateReadings.headPose = Controller.getPoseValue(Controller.Standard.Head);
    currentStateReadings.rhandPose = Controller.getPoseValue(Controller.Standard.RightHand);
    currentStateReadings.lhandPose = Controller.getPoseValue(Controller.Standard.LeftHand);

    var headPoseRigSpace = Quat.multiply(CHANGE_OF_BASIS_ROTATION, currentStateReadings.headPose.rotation);
    headPoseAverageOrientation = Quat.slerp(headPoseAverageOrientation, headPoseRigSpace, AVERAGING_RATE);
    var headPoseAverageEulers = Quat.safeEulerAngles(headPoseAverageOrientation);

    if (Math.abs(headPoseAverageEulers.y) > HEAD_TURN_THRESHOLD) {
        //  Turn feet
        MyAvatar.triggerRotationRecenter();
        headPoseAverageOrientation = { x: 0, y: 0, z: 0, w: 1 };
    }

    // and the hand to hip vector to determine when to change head rotation. 
    // leftHandOrientation = Quat.multiply(MyAvatar.orientation, currentStateReadings.lhandPose.rotation);
    // rightHandOrientation = Quat.multiply(MyAvatar.orientation, currentStateReadings.rhandPose.rotation);
    var leftHandPositionRigSpace = Vec3.multiplyQbyV(Quat.inverse(CHANGE_OF_BASIS_ROTATION), currentStateReadings.lhandPose.translation);
    var rightHandPositionRigSpace = Vec3.multiplyQbyV(Quat.inverse(CHANGE_OF_BASIS_ROTATION), currentStateReadings.rhandPose.translation);

    //  Update angle from hips to hand, to be used for turning 
    var hipToLeftHandAngle = Vec3.orientedAngle({ x: 0, y: 0, z: 1 }, { x: leftHandPositionRigSpace.x, y: 0, z: leftHandPositionRigSpace.z }, { x: 0, y: 1, z: 0 });
    var hipToLeftHand = Quat.lookAtSimple({ x: 0, y: 0, z: 0 }, { x: leftHandPositionRigSpace.x, y: 0, z: leftHandPositionRigSpace.z });
    var hipToRightHand = Quat.lookAtSimple({ x: 0, y: 0, z: 0 }, { x: rightHandPositionRigSpace.x, y: 0, z: rightHandPositionRigSpace.z });
    hipToLeftHandAverage = Quat.slerp(hipToLeftHandAverage, hipToLeftHand, AVERAGING_RATE);
    hipToRightHandAverage = Quat.slerp(hipToRightHandAverage, hipToRightHand, AVERAGING_RATE);
    var leftRightMidpoint = (Quat.safeEulerAngles(hipToLeftHandAverage).y + Quat.safeEulerAngles(hipToRightHandAverage).y) / 2.0;
    var FILTER_FACTOR = 0.01;
    averageAzimuth = leftRightMidpoint * (FILTER_FACTOR) + averageAzimuth * (1 - FILTER_FACTOR);
    spine2Rotation = Quat.angleAxis(averageAzimuth, { x: 0, y: 1, z: 0 });
    // print("spine 2 orientation " + spine2Rotation.x + " " + spine2Rotation.y + " " + spine2Rotation.z + " " + spine2Rotation.w);
    // print("average azimuth " + averageAzimuth);
    print("hip to left hand angle " + hipToLeftHandAngle);
    // print("left right midpoint " + leftRightMidpoint);
    // print("left hand position " + leftHandPositionRigSpace.x + " " + leftHandPositionRigSpace.y + " " + leftHandPositionRigSpace.z);
    // print("right hand position " + rightHandPositionRigSpace.x + " " + rightHandPositionRigSpace.y + " " + rightHandPositionRigSpace.z);
    // print("hip to left hand average " + hipToLeftHandAverage.x + " " + hipToLeftHandAverage.y + " " + hipToLeftHandAverage.z + " " + hipToLeftHandAverage.w);
}

function shutdownTabletApp() {
    tablet.removeButton(tabletButton);
    if (activated) {
        // tablet.webEventReceived.disconnect(onWebEventReceived);
        tablet.gotoHomeScreen();
    }
    // tablet.screenChanged.disconnect(onScreenChanged);
}

tabletButton.clicked.connect(manageClick);
// tablet.screenChanged.connect(onScreenChanged);

Script.update.connect(update);

Controller.keyPressEvent.connect(onKeyPress);

Script.scriptEnding.connect(function () {
    MyAvatar.hmdLeanRecenterEnabled = true;
    Script.update.disconnect(update);
    shutdownTabletApp();
});