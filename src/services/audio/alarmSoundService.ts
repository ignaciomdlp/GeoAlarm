import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';
import { AlarmAudioConfig, VIBRATION_PRESETS } from '../../domain/models/alarm';

class AlarmSoundService {
  private player: AudioPlayer | null = null;
  private isAlarmPlaying = false;

  public async setupAudioMode(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
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

      const source = { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' };
      this.player = createAudioPlayer(source);
      this.player.loop = true;
      if (config.volume !== undefined) {
        this.player.volume = config.volume;
      }
      this.player.play();

      const pattern = config.vibration?.pattern || VIBRATION_PRESETS.continuous.pattern;
      Vibration.vibrate(pattern, true);
    } catch (error) {
      console.error('[AlarmSoundService] Trigger failed:', error);
    }
  }

  public async stopAlarm(): Promise<void> {
    this.isAlarmPlaying = false;
    Vibration.cancel();

    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (err) {
        console.error('[AlarmSoundService] Stop error:', err);
      } finally {
        this.player = null;
      }
    }
  }
}

export const alarmSoundService = new AlarmSoundService();
