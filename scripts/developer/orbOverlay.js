/* jslint bitwise: true */

/* global Script, Vec3, MyAvatar, Tablet, Messages, Quat, 
DebugDraw, Mat4, Entities, Xform, Controller, Camera, console, document*/

var orb;

Script.setTimeout(function() {
    orb = Overlays.addOverlay("sphere", {
        color: { red: 255, green: 0, blue: 255 },
        position: Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 0, z: -3 })),
        rotation: MyAvatar.orientation,
        dimensions: { x: 0.3, y: 0.3, z: 0.3 },
        solid: true
    });
},100);


// Controller.keyPressEvent.connect(onKeyPress);


Script.scriptEnding.connect(function () {
    Overlays.deleteOverlay(orb);
});