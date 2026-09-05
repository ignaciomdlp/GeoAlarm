export type AlarmId = string;

export type VibrationPatternId = 'continuous' | 'pulse' | 'sos';

export interface VibrationPattern {
  id: VibrationPatternId;
  name: string;
  pattern: number[];
}

export type SoundKey = 'siren' | 'bell' | 'digital' | 'radar';

export interface AlarmAudioConfig {
  soundKey: SoundKey;
  volume: number;
  vibration: VibrationPattern;
}

export interface GeofenceCoordinate {
  latitude: number;
  longitude: number;
  address?: string;
  name: string;
}

export interface Alarm {
  id: AlarmId;
  name: string;
  destination: GeofenceCoordinate;
  radiusMeters: number;
  isActive: boolean;
  audioConfig: AlarmAudioConfig;
  createdAt: string;
  updatedAt: string;
  syncedWithCloud: boolean;
}

export const VIBRATION_PRESETS: Record<VibrationPatternId, VibrationPattern> = {
  continuous: {
    id: 'continuous',
    name: 'Continuo e Intenso',
    pattern: [1000, 400, 1000, 400],
  },
  pulse: {
    id: 'pulse',
    name: 'Pulsaciones Rápidas',
    pattern: [400, 200, 400, 200, 400, 200],
  },
  sos: {
    id: 'sos',
    name: 'Patrón S.O.S.',
    pattern: [200, 200, 200, 200, 600, 300, 600, 300, 200, 200],
  },
};
