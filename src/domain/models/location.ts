export interface LocationReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  timestamp: number;
}

export type PollingTier = 'FAR' | 'MEDIUM' | 'CLOSE' | 'TRIGGERED';

export interface TrackingStatus {
  isTracking: boolean;
  currentLocation: LocationReading | null;
  distanceToTargetMeters: number | null;
  currentPollingTier: PollingTier;
  lastEvaluatedAt: number | null;
}
