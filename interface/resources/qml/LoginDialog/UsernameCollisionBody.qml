//
//  UsernameCollisionBody.qml
//
//  Created by Clement on 7/18/16
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import Hifi 1.0
import QtQuick 2.4
import QtQuick.Controls 1.4

import controlsUit 1.0 as HifiControlsUit
import stylesUit 1.0 as HifiStylesUit
import TabletScriptingInterface 1.0

Item {
    id: usernameCollisionBody
    clip: true
    width: root.width
    height: root.height
    readonly property string fontFamily: "Raleway"
    readonly property int fontSize: 15
    readonly property bool fontBold: true

    readonly property string errorString: errorString

    function create() {
        mainTextContainer.visible = false
        loginDialog.createAccountFromSteam(textField.text);
    }

    property bool keyboardEnabled: false
    property bool keyboardRaised: false
    property bool punctuationMode: false

    onKeyboardRaisedChanged: d.resize();

    QtObject {
        id: d
        readonly property int minWidth: 480
        readonly property int minWidthButton: !root.isTablet ? 256 : 174
        property int maxWidth: root.isTablet ? 1280 : root.width
        readonly property int minHeight: 120
        readonly property int minHeightButton: 36
        property int maxHeight: root.isTablet ? 720 : root.height

        function resize() {
            maxWidth = root.isTablet ? 1280 : root.width;
            maxHeight = root.isTablet ? 720 : root.height;
            var targetWidth = Math.max(titleWidth, mainContainer.width);
            var targetHeight =  mainTextContainer.height +
                                hifi.dimensions.contentSpacing.y + textField.height +
                                hifi.dimensions.contentSpacing.y + buttons.height;

            parent.width = root.width = Math.max(d.minWidth, Math.min(d.maxWidth, targetWidth))
            parent.height = root.height = Math.max(Math.max(d.minHeight, Math.min(d.maxHeight, targetHeight)), mainContainer.height +
                (keyboardEnabled && keyboardRaised ? (200 + 2 * hifi.dimensions.contentSpacing.y) : hifi.dimensions.contentSpacing.y));
        }
    }

    Item {
        id: mainContainer
        width: root.width
        height: root.height
        onHeightChanged: d.resize(); onWidthChanged: d.resize();
        anchors.fill: parent

        Rectangle {
            id: opaqueRect
            height: parent.height
            width: parent.width
            opacity: 0.9
            color: "black"
        }

        Item {
            id: bannerContainer
            width: parent.width
            height: banner.height
            anchors {
                top: parent.top
                topMargin: 0.18 * parent.height
            }
            Image {
                id: banner
                anchors.centerIn: parent
                source: "../../images/high-fidelity-banner.svg"
                horizontalAlignment: Image.AlignHCenter
            }
        }

        TextMetrics {
            id: mainTextContainerTextMetrics
            font: mainTextContainer.font
            text: mainTextContainer.text
        }

        Text {
            id: mainTextContainer
            anchors {
                top: parent.top
                left: parent.left
                leftMargin: (parent.width - mainTextContainer.width) / 2
                topMargin: parent.height/2 - buttons.anchors.topMargin - textField.height - mainTextContainerTextMetrics.height
            }

            font.family: usernameCollisionBody.fontFamily
            font.pixelSize: usernameCollisionBody.fontSize
            font.bold: usernameCollisionBody.fontBold
            text: qsTr("Your Steam username is not available.")
            wrapMode: Text.WordWrap
            color: hifi.colors.redAccent
            lineHeight: 1
            lineHeightMode: Text.ProportionalHeight
            horizontalAlignment: Text.AlignHCenter
        }


        HifiControlsUit.TextField {
            id: textField
            anchors {
                top: mainTextContainer.bottom
                left: parent.left
                leftMargin: (parent.width - width) / 2
                topMargin: hifi.dimensions.contentSpacing.y
            }
            font.family: "Fira Sans"
            font.pixelSize: usernameCollisionBody.fontSize
            styleRenderType: Text.QtRendering
            font.bold: usernameCollisionBody.fontBold
            width: banner.width

            placeholderText: "Choose your own"

            onFocusChanged: {
                root.text = "";
                root.isPassword = !focus;
            }

            Keys.onPressed: {
                if (!visible) {
                    return;
                }

                switch (event.key) {
                    case Qt.Key_Enter:
                    case Qt.Key_Return:
                        event.accepted = true;
                        usernameCollisionBody.create();
                        break;
                }
            }
        }

        // Override ScrollingWindow's keyboard that would be at very bottom of dialog.
        HifiControlsUit.Keyboard {
            raised: keyboardEnabled && keyboardRaised
            numeric: punctuationMode
            anchors {
                left: parent.left
                right: parent.right
                bottom: buttons.top
                bottomMargin: keyboardRaised ? 2 * hifi.dimensions.contentSpacing.y : 0
            }
        }

        Item {
            id: buttons
            width: banner.width
            height: d.minHeightButton
            anchors {
                top: textField.bottom
                topMargin: hifi.dimensions.contentSpacing.y
                left: parent.left
                leftMargin: (parent.width - banner.width) / 2
            }

            HifiControlsUit.Button {
                id: cancelButton
                anchors {
                    top: parent.top
                    left: parent.left
                }
                width: (parent.width - hifi.dimensions.contentSpacing.x) / 2
                height: d.minHeightButton

                text: qsTr("CANCEL")
                color: hifi.buttons.noneBorderlessWhite

                fontFamily: usernameCollisionBody.fontFamily
                fontSize: usernameCollisionBody.fontSize
                fontBold: usernameCollisionBody.fontBold
                onClicked: {
                    bodyLoader.setSource("CompleteProfileBody.qml", { "loginDialog": loginDialog, "root": root, "bodyLoader": bodyLoader });
                }
            }
            HifiControlsUit.Button {
                id: profileButton
                anchors {
                    top: parent.top
                    right: parent.right
                }
                width: (parent.width - hifi.dimensions.contentSpacing.x) / 2
                height: d.minHeightButton

                text: qsTr("Create your profile")
                color: hifi.buttons.blue

                fontFamily: usernameCollisionBody.fontFamily
                fontSize: usernameCollisionBody.fontSize
                fontBold: usernameCollisionBody.fontBold
                onClicked: {
                    usernameCollisionBody.create();
                }
            }
        }
    }

    // Component.onCompleted: {
    //     root.text = "";
    //     d.resize();
    //     textField.focus = true;
    //     if (usernameCollisionBody.errorString !== "") {
    //         mainTextContainer.visible = true;
    //         mainTextContainer.text = usernameCollisionBody.errorString;
    //     }
    // }

    Connections {
        target: loginDialog
        onHandleCreateCompleted: {
            console.log("Create Succeeded")
            loginDialog.loginThroughSteam();
            bodyLoader.setSource("LoggingInBody.qml", { "loginDialog": loginDialog, "root": root, "bodyLoader": bodyLoader, "withSteam": true, "fromBody": "UsernameCollisionBody" })
        }
        onHandleCreateFailed: {
            console.log("Create Failed: " + error)

            mainTextContainer.visible = true
            mainTextContainer.text = "\"" + textField.text + qsTr("\" is invalid or already taken.")
        }
        onHandleLoginCompleted: {
            console.log("Login Succeeded");
            loginDialog.dismissLoginDialog();
            root.tryDestroy();
        }

        onHandleLoginFailed: {
            console.log("Login Failed")
            mainTextContainer.text = "Login Failed";
        }
    }
}
