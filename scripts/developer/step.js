/* jslint bitwise: true */

/* global Script, Vec3, MyAvatar, Tablet, Messages, Quat, DebugDraw, Mat4, Entities, Xform, Controller, Camera*/

Script.registerValue("STEPAPP", true);

var LEFT = 0;
var RIGHT = 1;
var DEFAULT_AVATAR_HEIGHT = 1.64;
var TABLET_BUTTON_NAME = "STEP";
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

var maxHeightChange = 0.010;
var angularVelocityThreshold = 0.3;         
var handVelocityThreshold = -1.0;
var handAngularVelocityThreshold = 0.3;
var lateralEdge = 0.14;
var frontEdge = -0.10;
var backEdge = 0.13;

//  this should be changed by the actual base of support of the person? or Avatar?
//  You must have moved at least this far laterally to take a step
var MIN_STEP_DISTANCE = 0.03;               
var DONE_STEPPING_DISTANCE = 0.01;          
var AVERAGING_RATE = 1.0;
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
var modeArray = new Array(100);
var modeHeight = -10.0;
var stepTimer = -1.0;
var torsoLength = 1.0;
var defaultLength = 1.0;
var hipsRotation = {x: 0, y: 0, z: 0, w: 1};
var hipsPosition = {x: 0, y: 0, z: 0};
var spine2Rotation = {x: 0, y: -0.85, z: 0, w: 0.5};
var spine2Position = { x: 0, y: 0, z: 0 };
var frontLeft = { x: -lateralEdge, y: 0, z: frontEdge };
var frontRight = { x: lateralEdge, y: 0, z: frontEdge };
var backLeft = { x: -lateralEdge, y: 0, z: backEdge };
var backRight = { x: lateralEdge, y: 0, z: backEdge };

var inFront = Vec3.sum(MyAvatar.position, Vec3.multiply(1.5, Quat.getFront(MyAvatar.orientation)));

var handDotHead = [];
var headPosition;
var headAverageOrientation = MyAvatar.orientation;
var averageHeight = 1.0;
var handPosition;
var handOrientation;
var headOrientation;

var isStepping = false;
var isTurning = false;
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
//  createMarkers();
var headEulers;
var headAverageEulers;
var oldAngularVelocity = { x: 0.0, y: 0.0, z: 0.0 };
var headSwayCount = 0;
var accelerationArray = new Array(30);
var debugDrawBase = true;
var activated = false;
var documentLoaded = false;

var HTML_URL = Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/stepApp.html");
    
var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

var tabletButton = tablet.addButton({
    text: TABLET_BUTTON_NAME,
    icon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/step2.svg"),
    activeIcon: Script.resolvePath("http://hifi-content.s3.amazonaws.com/angus/stepApp/step2.svg")
});
tabletButton.clicked.connect(manageClick);
function drawBase() {
    // transform corners into world space, for rendering.
    // var avatarXform = new Xform(MyAvatar.orientation, MyAvatar.position);
    var worldPointLf = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, frontLeft));
    var worldPointRf = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, frontRight));
    var worldPointLb = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, backLeft));
    var worldPointRb = Vec3.sum(MyAvatar.position,Vec3.multiplyQbyV(MyAvatar.orientation, backRight));
    
    // print("world point is left front is: " + worldPointLf.x + " " + worldPointLf.y + " " + worldPointLf.z);
    print("front left point is " + frontLeft.x + " " + frontLeft.y + " " + frontLeft.z);

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


function manageClick() {
    if (activated) {
        tablet.gotoHomeScreen();
    } else {
        tablet.gotoWebScreen(HTML_URL);
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
        // tabletButton.editProperties({isActive: true});
        if (!activated) {
            // hook up to event bridge
            tablet.webEventReceived.connect(onWebEventReceived);
            print("after connect web event");
            Script.setTimeout(function() {
                print("step app is loaded: " + documentLoaded);
            }, 500);
        }
        activated = true;
    } else {
        // tabletButton.editProperties({isActive: false});
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
tablet.screenChanged.connect(onScreenChanged);

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
    if (HMD.active) {
        // print("hmd height " + HMD.position.y);
        // to do: get the scaling correct here. AA
        // userScale = HMD.position.y / DEFAULT_AVATAR_HEIGHT;
    }
    return (isInsideLine(Vec3.multiply(userScale, frontLeft), Vec3.multiply(userScale, frontRight), pos)
        && isInsideLine(Vec3.multiply(userScale, frontRight), Vec3.multiply(userScale, backRight), pos)
        && isInsideLine(Vec3.multiply(userScale, backRight), Vec3.multiply(userScale, backLeft), pos)
        && isInsideLine(Vec3.multiply(userScale, backLeft), Vec3.multiply(userScale, frontLeft), pos));
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
            MyAvatar.triggerHorizontalRecenter();
            stepTimer = 0.6;
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
    headPosition = Camera.getPosition();
    headOrientation = Camera.getOrientation();
    headEulers = Quat.safeEulerAngles(headOrientation);
    headAverageEulers = Quat.safeEulerAngles(headAverageOrientation);
    var azimuth = headEulers.y;
    //  print("the head y euler is:" + headEulers.y);
    if (!lastHeadAzimuth) {
        lastHeadAzimuth = azimuth;
    }

    //  head position in object space
    headPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
    rightHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("RightHand"));
    leftHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("LeftHand"));
    var inSupport = withinBaseOfSupport(headPosAvatarSpace);
    // print("are we in the base of support? " + inSupport);
    
    addToModeArray(modeArray,headPose.translation.y);
    modeHeight = findMode(modeArray, modeHeight, torsoLength, defaultLength, headPose.translation.y);
    // print("the mode height is currently....  " + modeHeight + " user height " + headPose.translation.y);
    var totalHeadVelocity = Vec3.length(headPose.velocity);
    var xzAngularVelocity = Vec3.length({ x: headPose.angularVelocity.x, y: 0.0, z: headPose.angularVelocity.z });
    var xzRHandAngularVelocity = Vec3.length({ x: rightHandPose.angularVelocity.x, y: 0.0, z: rightHandPose.angularVelocity.z });
    var xzLHandAngularVelocity = Vec3.length({ x: leftHandPose.angularVelocity.x, y: 0.0, z: leftHandPose.angularVelocity.z });
    var isHeadLevel = (Math.abs(headEulers.z - headAverageEulers.z) < MAX_LEVEL_ROLL)
        && (Math.abs(headEulers.x - headAverageEulers.x) < MAX_LEVEL_PITCH);
    
    var heightDifferenceFromAverage = modeHeight - headPose.translation.y;

    // Check the hands one at a time 
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
    
    //  are we off the base of support, losing height and tilting the head 
    // 1. off the base of support. 2) head is not rotating too much 3) head hasn't lost too much height  4) hands are not still.
    // then we can translate
    if (!inSupport && (xzAngularVelocity < angularVelocityThreshold) && (heightDifferenceFromAverage < maxHeightChange)
         && ((!leftHandPose.valid || (handDotHead[LEFT] > handVelocityThreshold)) && (Vec3.length(leftHandPose.velocity) > VELOCITY_EPSILON)) 
         && ((!rightHandPose.valid || (handDotHead[RIGHT] > handVelocityThreshold)) && (Vec3.length(rightHandPose.velocity) > VELOCITY_EPSILON))
         && (xzRHandAngularVelocity < handAngularVelocityThreshold) && (xzLHandAngularVelocity < handAngularVelocityThreshold)) {
        isStepping = true;
        if (STEPTURN && (stepTimer < 0.0) ) {
            print("trigger recenter========================================================");
            MyAvatar.triggerHorizontalRecenter();
            stepTimer = 0.6;
        }
    }
    stepTimer -= dt;
    if (!HMD.active) {
        RESET_MODE = false;
    }
     
    //  Record averages
    headAverageOrientation = Quat.slerp(headAverageOrientation, headOrientation, AVERAGING_RATE);
    
    //  this will vary with the height of the person being tracked......
    //  one percent of a taller person will give you greater variance in height.
    //  the threshold for height loss is the same for both heights.
    //  I think most walking is 2Hz.  So maybe we could try averaging over 30 frames instead of 100.
    averageHeight = headPosition.y * HEIGHT_AVERAGING_RATE + averageHeight * (1.0 - HEIGHT_AVERAGING_RATE);

    //  Check for need to turn, by measuring if the head has turned past a threshold, 
    //  AND the hands are on either side of the head and fairly evenly distributed, 
    //  AND a few seconds has passed
    var angleToLeft = limitAngle(azimuth - Quat.safeEulerAngles(hipToHandAverage[LEFT]).y);
    var angleToRight = limitAngle(azimuth - Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y); 
    var angleToMarker = limitAngle(azimuth - lastHeadAzimuth);
    
    var leftRightMidpoint = (Quat.safeEulerAngles(hipToHandAverage[LEFT]).y + Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y) / 2.0;
    //  lets try using this 100% of the time first.

    //  head has turned more than threshold minimum.
    //  the hands are on either side of the head.
    //  the difference between the head and right hand look at compared to 
    //  head to left hand look at is greater than 1/2 and
    //  less than 2  
         
    if ((headPosition.y - modeHeight) > -0.02) {
        //  print("leftrightmidpoint " + leftRightMidpoint + " average azimuth " + average_azimuth);
        //  print("average azimuth " + average_azimuth);
        averageAzimuth = leftRightMidpoint * (0.01) + averageAzimuth * (0.99);

        //  hipsRotation = {x: 0,y: 1,z: 0,w: 0};
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
        
        
    if (azimuthChangeTimer > AZIMUTH_TIME_SECS) {
        //  Turn feet
        isTurning = true;
        if (STEPTURN) {
            MyAvatar.triggerRotationRecenter();
            //  hipsRotation = {x: 0,y: 0,z: 0,w: 1};//Quat.angleAxis((leftRightMidpoint - average_azimuth),{x: 0,y: 1,z: 0});
            //  average_azimuth = (leftRightMidpoint - average_azimuth);
            //  print("js trigger rotation...................................................");
        }
        lastHeadAzimuth = averageAzimuth;
        azimuthChangeTimer = 0;
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

Script.update.connect(update);
Controller.keyPressEvent.connect(onKeyPress);
Script.scriptEnding.connect(function () {
    Script.update.disconnect(update);
    shutdownTabletApp();
});
