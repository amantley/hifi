//
//  Audio.h
//  interface/src/scripting
//
//  Created by Zach Pomerantz on 28/5/2017.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_scripting_Audio_h
#define hifi_scripting_Audio_h

#include "AudioScriptingInterface.h"
#include "AudioDevices.h"
#include "AudioEffectOptions.h"
#include "SettingHandle.h"
#include "AudioFileWav.h"
#include <shared/ReadWriteLockable.h>

namespace scripting {

class Audio : public AudioScriptingInterface, protected ReadWriteLockable {
    Q_OBJECT
    SINGLETON_DEPENDENCY

    Q_PROPERTY(bool muted READ isMuted WRITE setMuted NOTIFY mutedChanged)
    Q_PROPERTY(bool noiseReduction READ noiseReductionEnabled WRITE enableNoiseReduction NOTIFY noiseReductionChanged)
    Q_PROPERTY(float inputVolume READ getInputVolume WRITE setInputVolume NOTIFY inputVolumeChanged)
    Q_PROPERTY(float inputLevel READ getInputLevel NOTIFY inputLevelChanged)
    Q_PROPERTY(QString context READ getContext NOTIFY contextChanged)
    Q_PROPERTY(AudioDevices* devices READ getDevices NOTIFY nop)

public:
    static QString AUDIO;
    static QString HMD;
    static QString DESKTOP;

    static float loudnessToLevel(float loudness);

    virtual ~Audio() {}

    bool isMuted() const;
    bool noiseReductionEnabled() const;
    float getInputVolume() const;
    float getInputLevel() const;
    QString getContext() const;

    void showMicMeter(bool show);

    Q_INVOKABLE void setInputDevice(const QAudioDeviceInfo& device, bool isHMD);
    Q_INVOKABLE void setOutputDevice(const QAudioDeviceInfo& device, bool isHMD);
    Q_INVOKABLE void setReverb(bool enable);
    Q_INVOKABLE void setReverbOptions(const AudioEffectOptions* options);

    Q_INVOKABLE bool startRecording(const QString& filename);
    Q_INVOKABLE void stopRecording();
    Q_INVOKABLE bool getRecording();

signals:
    void nop();
    void mutedChanged(bool isMuted);
    void noiseReductionChanged(bool isEnabled);
    void inputVolumeChanged(float volume);
    void inputLevelChanged(float level);
    void contextChanged(const QString& context);

public slots:
    void onContextChanged();

private slots:
    void setMuted(bool muted);
    void enableNoiseReduction(bool enable);
    void setInputVolume(float volume);
    void onInputLoudnessChanged(float loudness);

protected:
    // Audio must live on a separate thread from AudioClient to avoid deadlocks
    Audio();

private:

    float _inputVolume { 1.0f };
    float _inputLevel { 0.0f };
    bool _isMuted { false };
    bool _enableNoiseReduction { true };  // Match default value of AudioClient::_isNoiseGateEnabled.
    bool _contextIsHMD { false };
    AudioDevices* getDevices() { return &_devices; }
    AudioDevices _devices;
};

};

#endif // hifi_scripting_Audio_h
