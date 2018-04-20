/* global Xform */
Script.include("/~/system/libraries/Xform.js");

var ANIM_VARS = [
    "isTalking",
    "isNotMoving",
    "isMovingForward",
    "isMovingBackward",
    "isMovingRight",
    "isMovingLeft",
    "isTurningRight",
    "isTurningLeft",
    "isFlying",
    "isTakeoffStand",
    "isTakeoffRun",
    "isInAirStand",
    "isInAirRun",
    "hipsPosition",
    "hipsRotation",
    "hipsType",
    "headWeight",
    "headType"
];

var DEBUGDRAWING = false;

var WHITE = {r: 1, g: 1, b: 1, a: 1};
var BLACK = {r: 0, g: 0, b: 0, a: 1};
var YELLOW = {r: 1, g: 1, b: 0, a: 1};
var BLUE = {r: 0, g: 0, b: 1, a: 1};
var GREEN = {r: 0, g: 1, b: 0, a: 1};
var RED = {r: 1, g: 0, b: 0, a: 1};

var ROT_Y90 = {x: 0, y: 0.7071067811865475, z: 0, w: 0.7071067811865476};
var ROT_Y180 = {x: 0, y: 1, z: 0, w: 0};
var FLOOR_Y = -0.9;
var IDENT_QUAT = {x: 0, y: 0, z: 0, w: 1};

var TABLET_BUTTON_NAME = "CG";
var RECENTER = false;
MyAvatar.hmdLeanRecenterEnabled = RECENTER;
var dampening = 0.0;





var hipsPosition = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
var hipsRotation = {x: 0, y: 0, z: 0, w: 1};
var headToHips = hipsPosition.y - MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head")).y;
// AJT: TODO USE THIS
var forwardbool = false;
var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

var tabletButton = tablet.addButton({
    text: TABLET_BUTTON_NAME,
	icon: "icons/tablet-icons/avatar-record-i.svg",
	//icon:"icons/tablet-icons/finger-paint-i.svg",
});

tabletButton.clicked.connect(function () {
	print("recenter is: " + RECENTER);
	MyAvatar.hmdLeanRecenterEnabled = RECENTER;
	RECENTER = !RECENTER;
});






var handlerId = MyAvatar.addAnimationStateHandler(function (props) {

    var result = {};

    // prevent animations from ever leaving the idle state
    result.isTalking = false;
    //result.isNotMoving = true;
	
	//result.isNotMoving = true;
	//result.isMovingForward = false;
	
    //result.isMovingBackward = false;
	
    //result.isMovingRight = false;
    //result.isMovingLeft = false;
    //result.isTurningRight = false;
    //result.isTurningLeft = false;
    result.isFlying = false;
    result.isTakeoffStand = false;
    result.isTakeoffRun = false;
    result.isInAirStand = false;
    result.isInAirRun = false;

    result.hipsPosition = Vec3.multiplyQbyV(ROT_Y180, hipsPosition);
    result.hipsRotation = hipsRotation;
    result.hipsType = 0;  // pos & rot
	

    result.headWeight = 4;
    result.headType = 4;  // spline

    return result;
}, ANIM_VARS);



var jointList = MyAvatar.getJointNames(); 
print (JSON.stringify(jointList));
print(jointList.length);
var rightFootName = null;
var leftFootName = null;
var rightToeName = null;
var leftToeName = null;
var leftToeEnd = null;
var rightToeEnd = null;
var leftFoot;
var rightFoot;
var lastdesiredCg = {x:0,y:0,z:0};
var scaletanhleftright = 0.0;
var scaletanhforwardback = 0.0;


for(var i =0;i<jointList.length;i++){
	if( (jointList[i].indexOf('Right') !== -1) && (jointList[i].indexOf('Foot') !== -1) ) {
		print(JSON.stringify(jointList[i]));
		rightFootName = jointList[i];
	}
	if( (jointList[i].indexOf('Left') !== -1) && (jointList[i].indexOf('Foot') !== -1) ) {
		print(JSON.stringify(jointList[i]));
		leftFootName = jointList[i];
	}
	if( (jointList[i].indexOf('Right') !== -1) && (jointList[i].indexOf('Toe') !== -1) && (jointList[i].indexOf('End') !== -1) ) {
		print(JSON.stringify(jointList[i]));
		rightToeName = jointList[i];
	}
	if( (jointList[i].indexOf('Left') !== -1) && (jointList[i].indexOf('Toe') !== -1) && (jointList[i].indexOf('End') !== -1) ) {
		print(JSON.stringify(jointList[i]));
		leftToeName = jointList[i];
	}
}

function computeBase() {
        		
    if (rightFootName == null || leftFootName == null){
		//if the feet names aren't found then use our best guess of the base.
		leftToeEnd = {x: 0.12, y: 0.0, z: 0.12};
		rightToeEnd = {x: -0.18, y: 0.0, z: 0.12};
		leftFoot = {x: 0.15, y: 0.0, z: -0.17};
		rightFoot = {x: -0.20, y: 0.0, z: -0.17};
	}else{
		//else we at least found the feet in the skeleton.
		var leftFootIndex = MyAvatar.getJointIndex(leftFootName);
		var rightFootIndex = MyAvatar.getJointIndex(rightFootName);
		var leftFoot = MyAvatar.getAbsoluteJointTranslationInObjectFrame(leftFootIndex);
		var rightFoot = MyAvatar.getAbsoluteJointTranslationInObjectFrame(rightFootIndex);
		
		if (rightToeName == null || leftToeName == null){
			//the toe ends were not found then we use a guess for the length and width of the feet. 
			leftToeEnd = {x: (leftFoot.x + .02), y: 0.0, z: (leftFoot.z -.2)};
			rightToeEnd = {x: (rightFoot.x - 0.02), y: 0.0, z: (rightFoot.z - .2)};
		}else{
			//else we found the toe ends and now we can really compute the base.
			var leftToeIndex = MyAvatar.getJointIndex(leftToeName);
			var rightToeIndex = MyAvatar.getJointIndex(rightToeName);
			leftToeEnd = MyAvatar.getAbsoluteJointTranslationInObjectFrame(leftToeIndex);
			rightToeEnd = MyAvatar.getAbsoluteJointTranslationInObjectFrame(rightToeIndex);
		}
			
	}
		
    // project each point into the FLOOR plane.
    var points = [{x: leftToeEnd.x, y: FLOOR_Y, z: leftToeEnd.z},
                  {x: rightToeEnd.x, y: FLOOR_Y, z: rightToeEnd.z},
                  {x: rightFoot.x, y: FLOOR_Y, z: rightFoot.z},
                  {x: leftFoot.x, y: FLOOR_Y, z: rightFoot.z}];

    // compute normals for each plane
    var normal, normals = [];
    var n = points.length;
    var next, prev;
    for (next = 0, prev = n - 1; next < n; prev = next, next++) {
        normal = Vec3.multiplyQbyV(ROT_Y90, Vec3.normalize(Vec3.subtract(points[next], points[prev])));
        normals.push(normal);
    }

    var TOE_FORWARD_RADIUS = 0.01;
    var TOE_SIDE_RADIUS = 0.05;
    var HEEL_FORWARD_RADIUS = 0.01;
    var HEEL_SIDE_RADIUS = 0.03;
    var radii = [
        TOE_SIDE_RADIUS, TOE_FORWARD_RADIUS, TOE_FORWARD_RADIUS, TOE_SIDE_RADIUS,
        HEEL_SIDE_RADIUS, HEEL_FORWARD_RADIUS, HEEL_FORWARD_RADIUS, HEEL_SIDE_RADIUS
    ];

    // subdivide base and extrude by the toe and heel radius.
    var newPoints = [];
    for (next = 0, prev = n - 1; next < n; prev = next, next++) {
        newPoints.push(Vec3.sum(points[next], Vec3.multiply(radii[2 * next], normals[next])));
        newPoints.push(Vec3.sum(points[next], Vec3.multiply(radii[(2 * next) + 1], normals[(next + 1) % n])));
    }

    // compute newNormals
    var newNormals = [];
    n = newPoints.length;
    for (next = 0, prev = n - 1; next < n; prev = next, next++) {
        normal = Vec3.multiplyQbyV(ROT_Y90, Vec3.normalize(Vec3.subtract(newPoints[next], newPoints[prev])));
        newNormals.push(normal);
    }
		
	for(var j = 0;j<points.length;j++){
		print(JSON.stringify(points[j]));
	}
    return {points: newPoints, normals: newNormals};

}

var base = computeBase();

//mirror points....


if (Math.abs(base.points[0].x) > Math.abs(base.points[3].x)){
	base.points[3].x = -base.points[0].x;
	base.points[2].x = -base.points[1].x;
}else{
	base.points[0].x = -base.points[3].x;
	base.points[1].x = -base.points[2].x;
}

if (Math.abs(base.points[4].x) > Math.abs(base.points[7].x)){
	base.points[7].x = -base.points[4].x;
	base.points[6].x = -base.points[5].x;	
}else{
	base.points[4].x = -base.points[7].x;
	base.points[5].x = -base.points[6].x;
}

if (Math.abs(base.points[0].z) > Math.abs(base.points[0].z)){
	base.points[3].z = base.points[0].z;
	base.points[2].z = base.points[1].z;	
}else{
	base.points[0].z = base.points[3].z;
	base.points[1].z = base.points[2].z;
}

if (Math.abs(base.points[4].z) > Math.abs(base.points[7].z)){
	base.points[7].z = base.points[4].z;
	base.points[6].z = base.points[5].z;	
}else{
	base.points[4].z = base.points[7].z;
	base.points[5].z = base.points[6].z;
}

for(var i = 0;i< base.points.length;i++){
	 
	print("point: " + i +" " + JSON.stringify(base.points[i]));
}
for(var i = 0;i< base.normals.length;i++){
	print("normal: " + i +" " + JSON.stringify(base.normals[i]));
}


function drawBase(base) {
    // transform corners into world space, for rendering.
    var xform = new Xform(MyAvatar.orientation, MyAvatar.position);
    var worldPoints = base.points.map(function (point) {
        return xform.xformPoint(point);
    });
    var worldNormals = base.normals.map(function (normal) {
        return xform.xformVector(normal);
    });

    var n = worldPoints.length;
    var next, prev;
    for (next = 0, prev = n - 1; next < n; prev = next, next++) {
		if(DEBUGDRAWING){
            // draw border
            DebugDraw.drawRay(worldPoints[prev], worldPoints[next], GREEN);
		    DebugDraw.drawRay(worldPoints[next], worldPoints[prev], GREEN);

            // draw normal   
            var midPoint = Vec3.multiply(0.5, Vec3.sum(worldPoints[prev], worldPoints[next]));
            DebugDraw.drawRay(midPoint, Vec3.sum(midPoint, worldNormals[next]), YELLOW);
		    DebugDraw.drawRay(midPoint, Vec3.sum(midPoint, worldNormals[next+1]), YELLOW);
		}
    }
}

var JOINT_MASSES = [{joint: "Head", mass: 20.0, pos: {x: 0, y: 0, z: 0}},
                    {joint: "LeftHand", mass: 2.0, pos: {x: 0, y: 0, z: 0}},
                    {joint: "RightHand", mass: 2.0, pos: {x: 0, y: 0, z: 0}}];

function computeCg() {
    // point mass.
    var n = JOINT_MASSES.length;
    var moments = {x: 0, y: 0, z: 0};
    var masses = 0;
    for (var i = 0; i < n; i++) {
        var pos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex(JOINT_MASSES[i].joint));
        JOINT_MASSES[i].pos = pos;
        moments = Vec3.sum(moments, Vec3.multiply(JOINT_MASSES[i].mass, pos));
        masses += JOINT_MASSES[i].mass;
    }
    return Vec3.multiply(1 / masses, moments);
}


function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function distancetoline(p1,p2,cg){
	
	var numerator = Math.abs((p2.z - p1.z)*(cg.x) - (p2.x - p1.x)*(cg.z) + (p2.x)*(p1.z) - (p2.z)*(p1.x));
	var denominator = Math.sqrt( Math.pow((p2.z - p1.z),2) + Math.pow((p2.x - p1.x),2)  );
	
	
	return numerator/denominator;
	
}
function my_tanh (num){
	return (Math.exp(2 * num) - 1) / (Math.exp(2 * num) + 1);
}

function damped_sin (num) {
	
	return ( Math.exp((-1.7)*num) * Math.cos((.2)*Math.PI*num ) );
}

function isLeft(a, b, c){
     return (((b.x - a.x)*(c.z - a.z) - (b.z - a.z)*(c.x - a.x)) > 0);
}

function slope(num){
	var constant = 1.0;
	return 1 - ( 1/(1+constant*num) );
}


function update(dt) {
	
    var cg = computeCg();
	//print("time elapsed " + dt);
    // hack clamp cg
	var clampfront = -.10;
	var clampback = .17;
	var clampleft = -.50;
	var clampright = .50;
    var desiredCg = {x: 0, y: 0, z: 0};
	
	//print("the raw cg " + cg.x + " " + cg.y + " " + cg.z);
	
	
	if (true){// (cg.z < clampfront) || (cg.z > clampback) ) {//|| (cg.x < clampleft) || (cg.x > clampright) ) {
        //clamp the cg and then skip the dampening 
		//print("cg.z "  + cg.z);
		desiredCg.x = cg.x //clamp(cg.x, clampleft, clampright);
        desiredCg.y = 0;
        desiredCg.z = clamp(cg.z, clampfront, clampback);
		//print("cg.z after clamp "  + desiredCg.z);
	}
	if(true){	
		//desiredCg = cg;
    	//find the distance of the cg to each of the four lines defining the base of support.
	    //take the closest line and do the dampening displacement function. 
		var p1 = {x:clampleft,y:0,z:clampfront};
		var p2 = {x:clampright,y:0,z:clampfront};
		var p3 = {x:clampleft,y:0,z:clampback};
		var p4 = {x:clampright,y:0,z:clampback};
		var retdist1 = distancetoline(p1,p2,cg);
		var retdist2 = distancetoline(p2,p4,cg);
		var retdist3 = distancetoline(p4,p3,cg);
		var retdist4 = distancetoline(p3,p1,cg);
	
		//print("the distance to the front line is:  " + retdist1);
		//print("the distance to the right line is:  " + retdist2);
		//print("the distance to the back line is:  " + retdist3);
		//print("the distance to the left line is:  " + retdist4);
	
		if (cg.z < -0.0){
			//scale displacement forward
			//scaleforwardback = Math.sin( (1 - (retdist1/0.15))*(Math.PI/2) );
			//only do this between 0-.05 distance.  we don't want a negative number for scale tanh
			var inputfront;
			if (isLeft(p1,p2,cg)){
				inputfront = (1-(retdist1/Math.abs(.1)));
			}else{
				//right of base of suppo'rt line
				inputfront = (1+(retdist1/Math.abs(.1)));
			}
			//print("input front " + inputfront);
			var scalefrontnew = slope(inputfront);
			//print("output front " + scalefrontnew);
			desiredCg.z = -0.0 + scalefrontnew*clampfront;
			
			//if((retdist1/Math.abs(clampfront))<1.0){
		    //    scaletanhforwardback = my_tanh( 2*(1 - (retdist1/Math.abs(clampfront))) );
		    //    desiredCg.z = scaletanhforwardback*desiredCg.z;
		    //}
			//print("scale tanh forward: " + scaletanhforwardback);
		
		}
			//scale it backward
			//scaleforwardback = Math.sin( (1-(retdist3/0.15))*(Math.PI/2) );
			
		if(cg.z > 0.0){	
		    var inputback;
		    if (isLeft(p3,p4,cg)){
			    inputback = (1+(retdist3/Math.abs(.17)));
		    }else{
			    //right of base of suppo'rt line
			    inputback = (1-(retdist3/Math.abs(.17)));
		    }
			var scalebacknew = slope(inputback);
			//print("output front " + scalefrontnew);
			desiredCg.z = 0.0 + scalebacknew*clampback;
       	}
		
		//var isitleft = isLeft(p2,p4,cg);
		//print("is left  " + isitleft);
		if (retdist2 < retdist4){
			//scale displacement right
			//
			
			
			    //scaletanhleftright = my_tanh( 2*(1 - (retdist2/Math.abs(clampright))) );
				//var scaleright = Math.sin( (1-(retdist2/Math.abs(clampright)))*(Math.PI/2) );
				var input;
				if (isLeft(p2,p4,cg)){
					input = (1-(retdist2/Math.abs(clampright)));
				}else{
					//right of base of support line
					input = (1+(retdist2/Math.abs(clampright)));
				}
				//print("input right " + input);
				var scalerightnew = slope(input);
				//print("output right " + scalerightnew);
				
					
				//var scalerightdampsin = damped_sin( 2*((1-(retdist2/Math.abs(clampright)))*(Math.PI/2)) );
			    //desiredCg.x = scaletanhleftright*clampright;
				//desiredCg.x = scaleright*clampright;
				desiredCg.x = scalerightnew*clampright;
				//desiredCg.x = (1-scalerightdampsin)*clampright;
			    //print("scale tanh right: " + scaletanhleftright);
			
		
		}else{
			//scale it left
			
			//scaletanhleftright = my_tanh( 2*(1 - (retdist4/Math.abs(clampleft))) );
			//var scaleleft = Math.sin( (1-(retdist4/Math.abs(clampleft)))*(Math.PI/2) );
			var input;
			if (isLeft(p1,p3,cg)){
				input = (1+(retdist4/Math.abs(clampleft)));
			}else{
				input = (1-(retdist4/Math.abs(clampleft)));
			}
			//print("input left" + input);
			var scaleleftnew = slope(input);
			//print("output left " + scaleleftnew);	
			//var scaleleftdampsin = damped_sin(2*(1 - (retdist4/Math.abs(clampleft))) );
			//desiredCg.x = scaletanhleftright*clampleft;
			//desiredCg.x = scaleleft*clampleft;
			desiredCg.x = scaleleftnew*clampleft;
			//desiredCg.x = (1-scaleleftdampsin)*clampleft;
			//print("scale tanh left: " + scaletanhleftright);
			
		}
	}
	//print("the desired cg " + desiredCg.x + " " + desiredCg.y + " " + desiredCg.z);
    // project onto floor plane, for debug rendering
    cg.y = FLOOR_Y;
	if(DEBUGDRAWING){
	    DebugDraw.addMyAvatarMarker("left toe", IDENT_QUAT, leftToeEnd, BLUE);
	    DebugDraw.addMyAvatarMarker("right toe", IDENT_QUAT, rightToeEnd, BLUE);
        DebugDraw.addMyAvatarMarker("cg", IDENT_QUAT, cg, BLUE);
        DebugDraw.addMyAvatarMarker("desiredCg", IDENT_QUAT, desiredCg, GREEN);
		drawBase(base);
	}
	
    // compute hips position to maintain desiredCg
    var HIPS_MASS = 40;
    var totalMass = JOINT_MASSES.reduce(function (accum, obj) {
        return accum + obj.mass;
    }, 0);
    var temp1 = Vec3.subtract(Vec3.multiply(totalMass + HIPS_MASS, desiredCg),
                              Vec3.multiply(JOINT_MASSES[0].mass, JOINT_MASSES[0].pos));
    var temp2 = Vec3.subtract(temp1,
                              Vec3.multiply(JOINT_MASSES[1].mass, JOINT_MASSES[1].pos));
    var temp3 = Vec3.subtract(temp2,
                              Vec3.multiply(JOINT_MASSES[2].mass, JOINT_MASSES[2].pos));
    var temp4 = Vec3.multiply(1 / HIPS_MASS, temp3);
	
	
	var currenthipsPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
	var currentheadPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
	var currentneckPos = MyAvatar.getAbsoluteJointTranslationInObjectFrame(MyAvatar.getJointIndex("Neck"));
	var tposeneckPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Neck"));
	var tposeheadPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Head"));
	var tposehipsPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("Hips"));
	var tposerightlegPos = MyAvatar.getAbsoluteDefaultJointTranslationInObjectFrame(MyAvatar.getJointIndex("RightLeg"));
	
	var xzdiff  = {x: (currentheadPos.x - temp4.x), y: 0, z: (currentheadPos.z-temp4.z)};
	var headminuship_xz = Vec3.length(xzdiff);
	
	
	var headhipdefault = Vec3.length(Vec3.subtract(tposeheadPos,tposehipsPos));
	var neckhipdefault = Vec3.length(Vec3.subtract(tposeneckPos,tposehipsPos));
	var neckhipmag = Vec3.length(Vec3.subtract(currentneckPos,currenthipsPos));
	var headhipmag = Vec3.length(Vec3.subtract(currentheadPos,currenthipsPos));
	//print("the length of the head hips is:  " + headhipdefault);
	//print("the length of the neck hips is:  " + headhipmag);
	
	var hipheight = Math.sqrt((headhipdefault*headhipdefault) - (headminuship_xz*headminuship_xz));
	//print("hip height " + hipheight);
	//print("default leg height " + tposerightlegPos.y);
	
	
	//print("the current head " + currentheadPos.x +" "+ currentheadPos.y + " " + currentheadPos.z);
    temp4.y = (currentheadPos.y - hipheight);
	if (temp4.y > tposehipsPos.y){
		temp4.y = 0.0;
	}
	//print("the original hips y " + hipsPosition.y);
	
    hipsPosition = temp4;
	var newy_axis_hips = Vec3.normalize(Vec3.subtract(currentheadPos,hipsPosition));
	var forward = {x:0.0,y:0.0,z:1.0};
	var xaxis = {x:1.0,y:0.0,z:0.0};
	var yaxis = {x:0.0,y:1.0,z:0.0};
	var oldxaxiships = Vec3.normalize( Vec3.multiplyQbyV( MyAvatar.getAbsoluteJointRotationInObjectFrame(MyAvatar.getJointIndex("Hips")),xaxis ) );
	var oldyaxiships = Vec3.normalize( Vec3.multiplyQbyV( MyAvatar.getAbsoluteJointRotationInObjectFrame(MyAvatar.getJointIndex("Hips")),yaxis ) );
	var oldzaxiships = Vec3.normalize( Vec3.multiplyQbyV( MyAvatar.getAbsoluteJointRotationInObjectFrame(MyAvatar.getJointIndex("Hips")),forward ) );
	var newx_axis_hips = Vec3.normalize(Vec3.cross(newy_axis_hips,oldzaxiships));
	var newz_axis_hips = Vec3.normalize(Vec3.cross(newx_axis_hips,newy_axis_hips));
	
	var beforehips = MyAvatar.getAbsoluteJointRotationInObjectFrame(MyAvatar.getJointIndex("Hips"));
	
	var left = {x:newx_axis_hips.x,   y:newx_axis_hips.y,   z:newx_axis_hips.z,  w:0.0};
	var up =   {x:newy_axis_hips.x,   y:newy_axis_hips.y,   z:newy_axis_hips.z,  w:0.0};
	var view = {x:newz_axis_hips.x,   y:newz_axis_hips.y,   z:newz_axis_hips.z,  w:0.0};
	var translation = {x:0.0,y:0.0,z:0.0,w:1.0};
	
	var newrothips = Mat4.createFromColumns(left,up,view,translation);
	
	var finalrot = Mat4.extractRotation(newrothips);
	
	hipsRotation = Quat.multiply(ROT_Y180, finalrot);

	if (DEBUGDRAWING){
	    DebugDraw.addMyAvatarMarker("hipsPos", IDENT_QUAT, hipsPosition, RED);
	}
}

Script.update.connect(update);

Script.scriptEnding.connect(function () {
    Script.update.disconnect(update);
	if (tablet) {
        tablet.removeButton(tabletButton);
    }
});
