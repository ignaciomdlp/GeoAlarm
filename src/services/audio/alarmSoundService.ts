import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';
import { AlarmAudioConfig, SoundKey, VIBRATION_PRESETS } from '../../domain/models/alarm';

const LOCAL_SOUND_ASSETS: Record<string, any> = {
  alarm1: require('../../../assets/sounds/alarma 1.mp3'),
  alarm2: require('../../../assets/sounds/alarma 2.mp3'),
  siren: require('../../../assets/sounds/alarma 1.mp3'),
  radar: require('../../../assets/sounds/alarma 2.mp3'),
};

class AlarmSoundService {
  private player: AudioPlayer | null = null;
  private isAlarmPlaying = false;
  private previewTimeout: ReturnType<typeof setTimeout> | null = null;

  public async setupAudioMode(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
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

      const source = config.customSoundUri
        ? { uri: config.customSoundUri }
        : (LOCAL_SOUND_ASSETS[config.soundKey] || LOCAL_SOUND_ASSETS.alarm1);
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

  public async previewSound(
    soundKeyOrUri: SoundKey | string,
    durationMs: number = 3000,
    isCustomUri: boolean = false
  ): Promise<void> {
    await this.stopAlarm();
    this.isAlarmPlaying = true;

    try {
      await this.setupAudioMode();
      const source = isCustomUri
        ? { uri: soundKeyOrUri }
        : (LOCAL_SOUND_ASSETS[soundKeyOrUri] || LOCAL_SOUND_ASSETS.alarm1);
      this.player = createAudioPlayer(source);
      this.player.loop = false;
      this.player.volume = 1.0;
      this.player.play();
      Vibration.vibrate([0, 300, 200, 300], false);

      if (this.previewTimeout) clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(async () => {
        await this.stopAlarm();
      }, durationMs);
    } catch (error) {
      console.error('[AlarmSoundService] Preview failed:', error);
      await this.stopAlarm();
    }
  }

  public async stopAlarm(): Promise<void> {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }

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

