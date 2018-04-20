// try to detect when to step and when to turn the body. 

var LEFT = 0;
var RIGHT = 1;

var COLOR_LEVEL = { red: 0, green: 0, blue: 255 };
var COLOR_NOT_LEVEL = { red: 128, green: 128, blue: 0 };
var COLOR_OFF_HEIGHT = { red: 255, green: 255, blue: 0 };
var COLOR_IS_STEPPING = { red: 255, green: 0, blue: 0 };

var COLOR_LEFT = { red: 0, green: 255, blue: 255 };
var COLOR_RIGHT = { red: 0, green: 255, blue: 255 };
var COLOR_AVERAGE = { red: 128, green: 128, blue: 128 };
var COLOR_DARK = { red: 50, green: 50, blue: 50 };

var COLOR_MOVEMENT = { red: 128, green: 128, blue: 128 };

var HAND_DIMENSIONS = { x: 0.03, y: 0.3, z: 0.03};

//  Pitch and Roll more than these number of degrees from long-term average prevent stepping.
var MAX_LEVEL_PITCH = 3;                        
var MAX_LEVEL_ROLL = 3;

var MAX_HEIGHT_CHANGE = 0.010; //.0075 was old value.            //  How far can the head move up or down before blocking stepping?

//this should be changed by the actual base of support of the person? or Avatar?
var MIN_STEP_DISTANCE = 0.03;               //  You must have moved at least this far laterally to take a step
var DONE_STEPPING_DISTANCE = 0.01;          
var AVERAGING_RATE = 1.0;
var HEIGHT_AVERAGING_RATE = 0.0025;
var STEP_VELOCITY_THRESHOLD = 0.05;         //  The velocity of head and hands in same direction that triggers stepping
var STEP_TIME_SECS = 0.15;                  //  The time required for observed velocity to continue to trigger stepping 

var AZIMUTH_TURN_MIN_DEGREES = 22;
var AZIMUTH_TIME_SECS = 2.5;
var HEAD_HAND_BALANCE = 2.0;

var TABLET_BUTTON_NAME = "ENABLE RECENTER";
var TABLET_BUTTON2_NAME = "TOGGLE STEP";
var TABLET_BUTTON3_NAME = "vertical";
var RECENTER = false;
MyAvatar.hmdLeanRecenterEnabled = RECENTER;
var STEPTURN = true;

var MY_HEIGHT = 1.15;
var mode_array = new Array(100);
var mode_height = -10.0;

var leaningdot = 1.0;
var leaningdotaverage = 1.0;
var torsolength = 1.0;
var defaultlength = 1.0;
//mode_array.push(1.2);
//mode_array.push(2.3);
//mode_array.push(1.2);

print("loaded the philip step file");

var hipsRotation = {x: 0, y: 0, z: 0, w:1};
var hipsPosition = {x: 0, y: 0, z: 0};
var spine2Rotation = {x: 0, y: -0.85, z: 0, w:0.5};
var spine2Position = {x: 0, y: 0, z: 0};

var ANIM_VARS = [
    //"headWeight",
    //"headType",
    "hipsRotation",
	//"hipsPosition",
	"hipsType",
	//"spine2Rotation",
	//"spine2Position",
	//"spine2Type"
];

/*
var handlerId2 = MyAvatar.addAnimationStateHandler(function (properties) {
	
	var result = {};
	//result.headWeight = 4;
    //result.headType = 4;
	//print("handler called");
	//print(hipsPosition.x + " " + hipsPosition.y + " " + hipsPosition.z );
    
	result.hipsRotation = hipsRotation;
	//result.hipsPosition = hipsPosition;
	result.hipsType = 1;
	//result.spine2Rotation = hipsRotation;
	//result.spine2Position = properties.spine2Position;
	//result.spine2Type = 4;
	return result;
}, ANIM_VARS);
*/


var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

var tabletButton = tablet.addButton({
    text: TABLET_BUTTON_NAME,
    
});

var tabletButton2 = tablet.addButton({
    text: TABLET_BUTTON2_NAME,
    
});

var tabletButton3 = tablet.addButton({
    text: TABLET_BUTTON3_NAME,
    
});

tabletButton.clicked.connect(function () {
    print("clicked recenter button");
	print("recenter is: " + RECENTER);
	MyAvatar.hmdLeanRecenterEnabled = RECENTER;

	RECENTER = !RECENTER;
});

tabletButton2.clicked.connect(function () {
    print("toggle stepping and turning");
	STEPTURN = !STEPTURN;
	print("stepping and turning is now --->>>> " + STEPTURN);
});

tabletButton3.clicked.connect(function () {
    print("toggle vertical");
	MyAvatar.triggerVerticalRecenter();
	//STEPTURN = !STEPTURN;
});

var lateralEdge = .09;
var frontEdge = -.07;
var backEdge  = .07;
var frontLeft = {x:-lateralEdge,y:0,z:frontEdge};
var frontRight = {x:lateralEdge,y:0,z:frontEdge};
var backLeft = {x:-lateralEdge,y:0,z:backEdge};
var backRight = {x:lateralEdge,y:0,z:backEdge};

function isInsideLine(a, b, c){
     return (((b.x - a.x)*(c.z - a.z) - (b.z - a.z)*(c.x - a.x)) > 0);
}

function withinBaseOfSupport(pos){
	
	if(!( isInsideLine(frontLeft,frontRight,pos) && isInsideLine(frontRight,backRight,pos) && isInsideLine(backRight,backLeft,pos) && isInsideLine(backLeft,frontLeft,pos) ) ) {
		//print("...........................................................")
		//print("within the front " + isInsideLine(frontLeft,frontRight,pos));
		//print("within the right " + isInsideLine(frontRight,backRight,pos));
		//print("within the back " + isInsideLine(backRight,backLeft,pos));
		//print("within the left " + isInsideLine(backLeft,frontLeft,pos));
	}
	return ( isInsideLine(frontLeft,frontRight,pos) && isInsideLine(frontRight,backRight,pos) && isInsideLine(backRight,backLeft,pos) && isInsideLine(backLeft,frontLeft,pos) );
}


function limitAngle(angle) {
    return (angle + 180) % 360 - 180;
}

function addToModeArray(arr,num){
	for(var i = 0 ;i < (arr.length - 1); i++){
		arr[i] = arr[i+1];
	}
	arr[arr.length - 1] = (Math.floor(num*100))/100.00;
}

function findMode(ary,current_mode){
    var numMapping = {};
    var greatestFreq = 0;
    var mode;
    ary.forEach(function findMode(number) {
        numMapping[number] = (numMapping[number] || 0) + 1;

        if ((greatestFreq < numMapping[number]) || ((numMapping[number] == 100) && (number > current_mode) )){
            greatestFreq = numMapping[number];
            mode = number;
        }
    });
	if (mode > current_mode){
        return +mode;	
	} else {
		
	    //if( (leaningdotaverage > .995) && (Math.abs(headPosition.y - averageHeight) < .003 ) && ((averageHeight - current_mode) < -.02) ){
		if( torsolength > (defaultlength+.03) ){
			print("reset mode");
			print("head position y "+ headPosition.y + " leaning dot " + leaningdot + " new mode "  + mode );
			return headPosition.y;
		}else {
            return current_mode; 
		}
		
		//return current_mode;
	}	
}

var inFront = Vec3.sum(MyAvatar.position, Vec3.multiply(1.5, Quat.getFront(MyAvatar.orientation)));

var handDotHead = [];
var headAveragePosition = Vec3.sum(inFront, { x: 0, y: 0.3, z: 0 });
var headPosition = headAveragePosition;
var headAverageOrientation = MyAvatar.orientation;
var averageHeight = 1.0;

var isStepping = false; 
var isTurning = false;
var handSteppingDetect = false;
var handSteppingTimer = 0;
var lastHeadAzimuth = 0;
var azimuthChangeTimer = 0;
var hipToHandAverage = [];
var average_azimuth = 0.0;

var headPosAvatarSpace;

//  If desired, create some test entities to show where the head and hands are pointed, etc. 
var hands = [];
var head, headAverage, lastAzimuthMarker, headAzimuthMarker, leftAzimuthMarker, rightAzimuthMarker; 
//createMarkers();

function heartbeat() {
	//print("heartbeat");
	//Entities.editEntity(head,{lifetime: 2000});
	//print(typeof head);
	//print("head is " + head);
	//print("lifetime is: " + Entities.getEntityProperties(head).lifetime );
	//print( Entities.getEntityProperties(head).lifetime == null);
	//print("name is: " + Entities.getEntityProperties(head).name );
	//print("time elapsed " + Entities.getLifetimeInSeconds());
	
	if (Entities.getEntityProperties(head).lifetime != null){
		//print("extend life now");
		Entities.editEntity(head,{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(headAverage,{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(hands[LEFT],{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(hands[RIGHT],{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(headAzimuthMarker,{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(lastAzimuthMarker,{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(rightAzimuthMarker,{lifetime: (5+Entities.getLifetimeInSeconds())});
		Entities.editEntity(leftAzimuthMarker,{lifetime: (5+Entities.getLifetimeInSeconds())});
	}
	/*
	if (Entities.getEntityProperties(head).lifetime != null){
		print("lifetime is: " + Entities.getEntityProperties(head).lifetime );
	} else {
		print("create new head object");
		head = Entities.addEntity({
			name: "head",
			type: "Box",
			dimensions: { x: 0.05, y: 0.05, z: 0.5},
			color: COLOR_LEVEL,
			position: headAveragePosition,
			collisionless: true,
			lifetime: 20,
			dynamic: false  
		});
	}
	*/
}


function update(dt) {
	
	//hipsPosition = {x: 0, y: 0.0, z: (hipsPosition.z + .1)};
	var currenthipsPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
	var currentheadPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
	var defaulthipsPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
	var defaultheadPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
	defaultlength = Vec3.length(Vec3.subtract(defaultheadPos, defaulthipsPos));
	print("default length " + defaultlength);
	var headminuship_lean = Vec3.subtract(currentheadPos,defaulthipsPos);
	torsolength = Vec3.length(headminuship_lean);
	print("torsolength " + torsolength);
	leaningdot = Vec3.dot(Vec3.normalize(headminuship_lean),{x:0,y:1,z:0});
	leaningdotaverage = leaningdot * HEIGHT_AVERAGING_RATE + leaningdotaverage * (1.0 - HEIGHT_AVERAGING_RATE);
	
    var sensorToWorldMatrix = MyAvatar.getSensorToWorldMatrix();
    var worldToSensorMatrix = Mat4.inverse(sensorToWorldMatrix);
    var avatarToWorldMatrix = Mat4.createFromRotAndTrans(MyAvatar.orientation, MyAvatar.position);

    //  Update head information
    var headPose = Controller.getPoseValue(Controller.Standard.Head);
    headPosition = Camera.getPosition();
    headOrientation = Camera.getOrientation();
    headEulers = Quat.safeEulerAngles(headOrientation);
    headAverageEulers = Quat.safeEulerAngles(headAverageOrientation);
    var azimuth = headEulers.y;
	//print("the head y euler is:" + headEulers.y);
    if (!lastHeadAzimuth) {
        lastHeadAzimuth = azimuth;
    }

	//head position in object space
	
	headPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
	rightHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("RightHand"));
	leftHandPosAvatarSpace = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("LeftHand"));
	var inSupport = withinBaseOfSupport(headPosAvatarSpace);
	
	//print("head average and current " + headAveragePosition.y + "..........................  ");
	//print("mode array test " + mode_array[0]);
	
	var retadd = addToModeArray(mode_array,headPosition.y);
	var ret_mode = findMode(mode_array,mode_height);
	mode_height = ret_mode; 
	//for (var j = 0 ; j < mode_array.length; j++){
	//	print("mode array " + mode_array[j]); 
	//}
	//print("the mode ..." + ret_mode + " mode_height " + mode_height +".........." + headPosition.y );//+ "leaning dot....." + leaningdot);
	
    //  If the head is not level, we cannot step. 
    var isHeadLevel = (Math.abs(headEulers.z - headAverageEulers.z) < MAX_LEVEL_ROLL) && (Math.abs(headEulers.x - headAverageEulers.x) < MAX_LEVEL_PITCH);
    var headColor = (isHeadLevel) ? COLOR_LEVEL : COLOR_NOT_LEVEL;
    
    //var deltaHead = Vec3.subtract(headPosition, headAveragePosition);
    var lateralDistanceFromAverage = {x:0,y:0,z:0};//Vec3.length({ x:deltaHead.x, y: 0, z:deltaHead.z });
    var heightDifferenceFromAverage =  mode_height - headPosition.y;//MY_HEIGHT);//averageHeight);
	//print("the mode part2 ..." + ret_mode + " mode_height " + mode_height +".........." + headPosition.y + " diff " + Math.abs(headPosition.y - mode_height));//+ "leaning dot....." + leaningdot);
    
    //  If height of head differs from long-term average, we cannot step.
    if (heightDifferenceFromAverage > MAX_HEIGHT_CHANGE) {
        headColor = COLOR_OFF_HEIGHT;
    }
    //  If head is level and at height, stepping can occur
	//this is not really lateral distance it is just distance from the average head position. 
	//this could be distance from the edge of the base of support.
    //if (!isStepping && (lateralDistanceFromAverage > MIN_STEP_DISTANCE) && (heightDifferenceFromAverage < MAX_HEIGHT_CHANGE) ){//&& isHeadLevel) {
		//print("in support " + inSupport + " is head level? "+ isHeadLevel + " diff from average  "  + heightDifferenceFromAverage);
	if ( !inSupport && (heightDifferenceFromAverage < MAX_HEIGHT_CHANGE) && isHeadLevel ) { //&& (heightDifferenceFromAverage < MAX_HEIGHT_CHANGE) && isHeadLevel &&!isStepping &&
        isStepping = true;
		if (STEPTURN) {
			print("trigger recenter=======================================================");
			MyAvatar.triggerHorizontalRecenter();
		}
    }
    if (isStepping && (lateralDistanceFromAverage < DONE_STEPPING_DISTANCE)) {
        isStepping = false;
    }
    if (isStepping) {
        headColor = COLOR_IS_STEPPING;
    }
     
    //  Record averages
    headAverageOrientation = Quat.slerp(headAverageOrientation, headOrientation, AVERAGING_RATE);
    headAveragePosition = Vec3.mix(headAveragePosition, headPosition, AVERAGING_RATE);
	
	//this will vary with the height of the person being tracked......
	//one percent of a taller person will give you greater variance in height.
	//the threshold for height loss is the same for both heights.
	//I think most walking is 2Hz.  So maybe we could try averaging over 30 frames instead of 100.
    averageHeight = headPosition.y * HEIGHT_AVERAGING_RATE + averageHeight * (1.0 - HEIGHT_AVERAGING_RATE);

    //  Check for need to turn, by measuring if the head has turned past a threshold, 
    //  AND the hands are on either side of the head and fairly evenly distributed, 
    //  AND a few seconds has passed
    var angleToLeft = limitAngle(azimuth - Quat.safeEulerAngles(hipToHandAverage[LEFT]).y);
    var angleToRight = limitAngle(azimuth - Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y); 
    var angleToMarker = limitAngle(azimuth - lastHeadAzimuth);
	
	var leftRightMidpoint = (Quat.safeEulerAngles(hipToHandAverage[LEFT]).y + Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y)/2.0;
	//lets try using this 100% of the time first.

    var headAzimuthMarkerColor = COLOR_RIGHT;
	//head has turned more than threshold minimum.
	//the hands are on either side of the head.
	//the difference between the head and right hand look at compared to 
	//head to left hand look at is greater than 1/2 and
	//less than 2  
	
	if(true){
		//print("left hand angle" + Quat.safeEulerAngles(hipToHandAverage[LEFT]).y + " limited " + limitAngle(Quat.safeEulerAngles(hipToHandAverage[LEFT]).y)); 
		//print("right hand angle" + Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y + " limited " + limitAngle(Quat.safeEulerAngles(hipToHandAverage[RIGHT]).y)); 
		//do nothing now 
		if ((headPosition.y - ret_mode) > -.02){
			print("leftrightmidpoint " + leftRightMidpoint + " average azimuth " + average_azimuth);
			//print("average azimuth " + average_azimuth);
			average_azimuth = leftRightMidpoint * (0.01) + average_azimuth * (0.99);
			hipsRotation = Quat.angleAxis(average_azimuth,{x:0,y:1,z:0});
		}
		//print("hips rotation js " + hipsRotation.x + " " + hipsRotation.y + " " + hipsRotation.z + " " + hipsRotation.w);
		var hipsrotmyavatar = MyAvatar.getAbsoluteJointRotationInObjectFrame(MyAvatar.getJointIndex("Hips"));
		//print("hips my avatar readiing js " + hipsrotmyavatar.x + " " + hipsrotmyavatar.y + " " + hipsrotmyavatar.z + " " + hipsrotmyavatar.w);
		
		if(Math.abs(leftRightMidpoint) > 20){
			if (Math.abs(leftRightMidpoint) > 60){
			    azimuthChangeTimer += 2*dt;
			}else{
			    azimuthChangeTimer += dt;	
			}
		}else{
			azimuthChangeTimer = 0
		}
		
		
		if (azimuthChangeTimer > AZIMUTH_TIME_SECS) {
            // Turn feet
            isTurning = true; 
			if (STEPTURN) {
				    MyAvatar.triggerRotationRecenter();
					//hipsRotation = {x:0,y:0,z:0,w:1};//Quat.angleAxis((leftRightMidpoint - average_azimuth),{x:0,y:1,z:0});
					//average_azimuth = (leftRightMidpoint - average_azimuth);
				    print("js trigger rotation...................................................");
			}
            lastHeadAzimuth = average_azimuth;
            azimuthChangeTimer = 0;
        }else{
			//isTurning = false;
		}
		 //= spine2Rot;
		//print("spine 2 new quat....     " + spine2Rot.x +" "+spine2Rot.y +" "+ spine2Rot.z +" "+ spine2Rot.w ); 
	}
	/*
    if ((Math.abs(angleToMarker) > AZIMUTH_TURN_MIN_DEGREES) &&
        (angleToLeft * angleToRight < 0) && 
        (Math.abs(angleToRight / angleToLeft) > 1 / HEAD_HAND_BALANCE) &&
        (Math.abs(angleToRight / angleToLeft) < HEAD_HAND_BALANCE) ) {
        headAzimuthMarkerColor = COLOR_IS_STEPPING;
        azimuthChangeTimer += dt;
        if (azimuthChangeTimer > AZIMUTH_TIME_SECS) {
            //  Actually turn 
            isTurning = true; 
			if (STEPTURN) {
				//MyAvatar.triggerRotationRecenter();
			}
            lastHeadAzimuth = azimuth;
            azimuthChangeTimer = 0;
        }
    } else {
        isTurning = false;
        headAzimuthMarkerColor = COLOR_RIGHT;
        azimuthChangeTimer = 0;
    }
	*/
    Entities.editEntity(head, { position: Vec3.sum(headPosition, Quat.getFront(MyAvatar.orientation)),
                                rotation: headOrientation, 
                                color: headColor});

    Entities.editEntity(headAverage, {  position: Vec3.sum(headAveragePosition, Quat.getFront(MyAvatar.orientation)),
                                        rotation: headAverageOrientation, 
                                        color: COLOR_AVERAGE});

    Entities.editEntity(lastAzimuthMarker, { position: Vec3.sum(MyAvatar.position, Quat.getFront(MyAvatar.orientation)), 
                                                rotation: Quat.fromPitchYawRollDegrees(0, lastHeadAzimuth, 0 )});

    Entities.editEntity(headAzimuthMarker, { position: Vec3.sum(MyAvatar.position, Quat.getFront(MyAvatar.orientation)), 
                                                rotation: Quat.fromPitchYawRollDegrees(0, azimuth, 0 ),
                                                color: headAzimuthMarkerColor });


    //  Check the hands one at a time 
    for (hand = LEFT; hand <= RIGHT; hand++)
    {
        //  Update hand object 
        var pose = Controller.getPoseValue((hand == 1) ? Controller.Standard.RightHand : Controller.Standard.LeftHand);
		

        var lateralPoseVelocity = pose.velocity; 
        lateralPoseVelocity.y = 0;
        var lateralHeadVelocity = headPose.velocity; 
        lateralHeadVelocity.y = 0;
        handDotHead[hand] = Vec3.dot(lateralPoseVelocity, lateralHeadVelocity);

        //handPosition = Mat4.transformPoint(avatarToWorldMatrix, pose.translation);
		handPosition = (hand == 1) ? rightHandPosAvatarSpace : leftHandPosAvatarSpace;
        handOrientation = Quat.multiply(MyAvatar.orientation, pose.rotation);
        var color = (handSteppingTimer > STEP_TIME_SECS) ? COLOR_IS_STEPPING : COLOR_LEFT;
       //  Update angle from hips to hand, to be used for turning 
        //var hipToHand = Quat.lookAtSimple({ x: MyAvatar.position.x, y: 0, z: MyAvatar.position.z }, { x: handPosition.x, y: 0, z: handPosition.z });
		var hipToHand = Quat.lookAtSimple({ x: 0, y: 0, z: 0 }, { x: handPosition.x, y: 0, z: handPosition.z });

        hipToHandAverage[hand] = Quat.slerp(hipToHandAverage[hand], hipToHand, AVERAGING_RATE);


        Entities.editEntity(hands[hand], {  position: Vec3.sum(handPosition, Quat.getFront(MyAvatar.orientation)),
                                            rotation: handOrientation,
                                            color: color,
                                            dimensions: Vec3.sum(HAND_DIMENSIONS, { x:0, y: Math.abs(handDotHead[hand]) * 3, z: 0 }) });
        
        Entities.editEntity(((hand == LEFT) ? leftAzimuthMarker : rightAzimuthMarker), 
                                                { position: Vec3.sum(MyAvatar.position, Quat.getFront(MyAvatar.orientation)), 
                                                  rotation: hipToHandAverage[hand]});


    }

    //  If the velocity of the hands in direction of head scaled by velocity of head is enough,
    //  trigger a step.  
    if ((handDotHead[LEFT] > STEP_VELOCITY_THRESHOLD) && (handDotHead[RIGHT] > STEP_VELOCITY_THRESHOLD)) {
        handSteppingDetect = true;
		if(STEPTURN) {
			//MyAvatar.triggerHorizontalRecenter();
		}
        handSteppingTimer += dt;
    } else {
        handSteppingDetect = false;
        handSteppingTimer = 0;
    }


}

Script.update.connect(update);
Script.setInterval(heartbeat,3000);
Script.scriptEnding.connect(function () {
	Script.update.disconnect(update);
    Entities.deleteEntity(head);
    Entities.deleteEntity(headAverage);
    Entities.deleteEntity(hands[LEFT]);
    Entities.deleteEntity(hands[RIGHT]);
    Entities.deleteEntity(lastAzimuthMarker);
    Entities.deleteEntity(headAzimuthMarker);
    Entities.deleteEntity(leftAzimuthMarker);
    Entities.deleteEntity(rightAzimuthMarker);
	
	if (tablet) {
        tablet.removeButton(tabletButton);
		tablet.removeButton(tabletButton2);
		tablet.removeButton(tabletButton3);
    }
	//tabletButton2.delete();

});

function createMarkers() {

    var AZIMUTH_MARKER_SIZE = { x: 0.01, y: 0.01, z: 0.4 }
    var LAST_AZIMUTH_MARKER_SIZE = { x: 0.007, y: 0.007, z: 0.45 }
	
	//print("previous head dimension");
	//print(head.dimensions.x);

    head = Entities.addEntity({
	name: "head",
    type: "Box",
    dimensions: { x: 0.05, y: 0.05, z: 0.5},
    color: COLOR_LEVEL,
    position: headAveragePosition,
    collisionless: true,
    lifetime: 50,
    dynamic: false  
    });

    headAverage = Entities.addEntity({
	name: "headAverage",
    type: "Box",
    dimensions: { x: 0.02, y: 0.02, z: 0.7},
    color: COLOR_LEVEL,
    position: headAveragePosition,
    lifetime: 50,
    collisionless: true,
    dynamic: false  
    });

    hands[LEFT] = Entities.addEntity({
	name: "handsleft",
    type: "Box",
    dimensions: HAND_DIMENSIONS,
    color: COLOR_LEFT,
    position: Vec3.sum(inFront, { x: -0.3, y: 0.3, z: 0 }),
    lifetime: 50,
    collisionless: true,
    dynamic: false  
    });

    hands[RIGHT] = Entities.addEntity({
	name: "handsright",
    type: "Box",
    dimensions: HAND_DIMENSIONS,
    color: COLOR_RIGHT,
    position: Vec3.sum(inFront, { x: 0.3, y: 0.3, z: 0 }),
	lifetime: 50,
    collisionless: true,
    dynamic: false  
    });

    lastAzimuthMarker = Entities.addEntity({
	name: "lastazimuth",
    type: "Box",
    dimensions: AZIMUTH_MARKER_SIZE,
    color: COLOR_DARK,
    position: inFront,
    collisionless: true,
    lifetime: 50,
    dynamic: false  
    });

    headAzimuthMarker = Entities.addEntity({
	name: "headazimuth",
    type: "Box",
    dimensions: AZIMUTH_MARKER_SIZE,
    color: COLOR_RIGHT,
    position: inFront,
    collisionless: true,
    lifetime: 50,
    dynamic: false  
    });

    leftAzimuthMarker = Entities.addEntity({
	name: "leftazimuth",
    type: "Box",
    dimensions: AZIMUTH_MARKER_SIZE,
    color: COLOR_AVERAGE,
    position: inFront,
    collisionless: true,
    lifetime: 50,
    dynamic: false  
    });

    rightAzimuthMarker = Entities.addEntity({
	name: "rightazimuth",
    type: "Box",
    dimensions: AZIMUTH_MARKER_SIZE,
    color: COLOR_AVERAGE,
    position: inFront,
    collisionless: true,
    lifetime: 50,
    dynamic: false  
    });
}