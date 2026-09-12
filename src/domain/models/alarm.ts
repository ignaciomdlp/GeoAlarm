export type AlarmId = string;

export type VibrationPatternId = 'continuous' | 'pulse' | 'sos';

export interface VibrationPattern {
  id: VibrationPatternId;
  name: string;
  pattern: number[];
}

export type SoundKey = 'alarm1' | 'alarm2' | 'siren' | 'radar';

export interface SoundOption {
  id: SoundKey;
  name: string;
  description: string;
}

export const AVAILABLE_SOUNDS: SoundOption[] = [
  { id: 'alarm1', name: 'Alarma Digital 1', description: 'Tono rítmico de alta penetración' },
  { id: 'alarm2', name: 'Alarma Intensa 2', description: 'Pitido crítico continuo para despertar' },
  { id: 'siren', name: 'Sirena (Alarma 1)', description: 'Alarma estándar de transporte' },
  { id: 'radar', name: 'Radar (Alarma 2)', description: 'Pulso de navegación' },
];

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
