import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { AlarmAudioConfig, VIBRATION_PRESETS } from '../../domain/models/alarm';

class AlarmSoundService {
  private soundObject: Audio.Sound | null = null;
  private isAlarmPlaying = false;

  public async setupAudioMode(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('[AlarmSoundService] Error setting audio mode:', error);
    }
  }

  public async triggerAlarm(config: AlarmAudioConfig): Promise<void> {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    try {
      await this.setupAudioMode();

      // Audio sintético nativo / stream de alarma
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
        {
          shouldPlay: true,
          isLooping: true,
          volume: config.volume ?? 1.0,
        },
        undefined,
        true
      );

      this.soundObject = sound;
      await this.soundObject.playAsync();

      const pattern = config.vibration?.pattern || VIBRATION_PRESETS.continuous.pattern;
      Vibration.vibrate(pattern, true);
    } catch (error) {
      console.error('[AlarmSoundService] Trigger failed:', error);
    }
  }

  public async stopAlarm(): Promise<void> {
    this.isAlarmPlaying = false;
    Vibration.cancel();

    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      } catch (err) {
        console.error('[AlarmSoundService] Unload error:', err);
      } finally {
        this.soundObject = null;
      }
    }
  }
}

export const alarmSoundService = new AlarmSoundService();
