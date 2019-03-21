"use strict";

(function(){
    var AppUi = Script.require("appUi");

    var ui;

    var button;
    var buttonName = "AVBAR";
    var onCreateAvatarInputsBarEntity = false;
    var micBarEntity, bubbleIconEntity;
    var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    var AVATAR_INPUTS_EDIT_QML_SOURCE = "hifi/EditAvatarInputsBar.qml";

    function fromQml(message) {
        console.log("message from QML: " + JSON.stringify(message));
    };

    function onClicked(){
        onCreateAvatarInputsBarEntity = !onCreateAvatarInputsBarEntity;
        button.editProperties({isActive: onCreateAvatarInputsBarEntity});
        // QML NATURAL DIMENSIONS
        var MIC_BAR_DIMENSIONS = {x: 0.036, y: 0.048, z: 0.3};
        var BUBBLE_ICON_DIMENSIONS = {x: 0.036, y: 0.036, z: 0.3};
        // CONSTANTS
        var LOCAL_POSITION_X_OFFSET = -0.2;
        var LOCAL_POSITION_Y_OFFSET = -0.125;
        var LOCAL_POSITION_Z_OFFSET = -0.5;
        // POSITIONS
        var micBarLocalPosition = {x: (-(MIC_BAR_DIMENSIONS.x / 2)) + LOCAL_POSITION_X_OFFSET, y: LOCAL_POSITION_Y_OFFSET, z: LOCAL_POSITION_Z_OFFSET};
        var bubbleIconLocalPosition = {x: (MIC_BAR_DIMENSIONS.x * 1.2 / 2) + LOCAL_POSITION_X_OFFSET, y: ((MIC_BAR_DIMENSIONS.y - BUBBLE_ICON_DIMENSIONS.y) / 2 + LOCAL_POSITION_Y_OFFSET), z: LOCAL_POSITION_Z_OFFSET};
        if (onCreateAvatarInputsBarEntity) {
            var props = {
                type: "Web",
                name: "AvatarInputsMicBarEntity",
                parentID: MyAvatar.SELF_ID,
                parentJointIndex: MyAvatar.getJointIndex("_CAMERA_MATRIX"),
                localPosition: micBarLocalPosition,
                localRotation: Quat.cancelOutRollAndPitch(Quat.lookAtSimple(Camera.orientation, micBarLocalPosition)),
                sourceUrl: Script.resourcesPath() + "qml/hifi/audio/MicBarApplication.qml",
                // cutoff alpha for detecting transparency
                alpha: 0.98,
                dimensions: MIC_BAR_DIMENSIONS,
                drawInFront: true,
                userData: {
                    grabbable: false
                },
            };
            micBarEntity = Entities.addEntity(props, "local");
            var props = {
                type: "Web",
                name: "AvatarInputsBubbleIconEntity",
                parentID: MyAvatar.SELF_ID,
                parentJointIndex: MyAvatar.getJointIndex("_CAMERA_MATRIX"),
                localPosition: bubbleIconLocalPosition,
                localRotation: Quat.cancelOutRollAndPitch(Quat.lookAtSimple(Camera.orientation, bubbleIconLocalPosition)),
                sourceUrl: Script.resourcesPath() + "qml/BubbleIcon.qml",
                // cutoff alpha for detecting transparency
                alpha: 0.98,
                dimensions: BUBBLE_ICON_DIMENSIONS,
                drawInFront: true,
                userData: {
                    grabbable: false
                },
            };
            bubbleIconEntity = Entities.addEntity(props, "local");
            tablet.loadQMLSource(AVATAR_INPUTS_EDIT_QML_SOURCE);
        } else {
            Entities.deleteEntity(micBarEntity);
            Entities.deleteEntity(bubbleIconEntity);
        }
    };

    function setup() {
        button = tablet.addButton({
        icon: "icons/tablet-icons/edit-i.svg",
        activeIcon: "icons/tablet-icons/edit-a.svg",
        text: buttonName
        });
        button.clicked.connect(onClicked);
    };

    setup();

    Script.scriptEnding.connect(function() {
        if (micBarEntity) {
            Entities.deleteEntity(micBarEntity);
        }
        if (bubbleIconEntity) {
            Entities.deleteEntity(bubbleIconEntity);
        }
        tablet.removeButton(button);
    });

}());
