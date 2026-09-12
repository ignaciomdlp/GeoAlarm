import { LocationReading, PollingTier } from '../../domain/models/location';

export interface GpsFilterOptions {
  maxAcceptableAccuracyMeters: number;
  maxLocationAgeMs: number;
}

export function getTolerancesForTier(tier: PollingTier = 'FAR'): GpsFilterOptions {
  switch (tier) {
    case 'CLOSE':
      return { maxAcceptableAccuracyMeters: 60, maxLocationAgeMs: 25000 };
    case 'MEDIUM':
      return { maxAcceptableAccuracyMeters: 120, maxLocationAgeMs: 45000 };
    case 'FAR':
    default:
      return { maxAcceptableAccuracyMeters: 250, maxLocationAgeMs: 65000 };
  }
}

export function isLocationReadingValid(
  reading: LocationReading,
  tier: PollingTier = 'FAR',
  customOptions?: Partial<GpsFilterOptions>
): boolean {
  if (
    Number.isNaN(reading.latitude) ||
    Number.isNaN(reading.longitude) ||
    reading.latitude < -90 ||
    reading.latitude > 90 ||
    reading.longitude < -180 ||
    reading.longitude > 180
  ) {
    return false;
  }

  const baseTolerances = getTolerancesForTier(tier);
  const maxAccuracy = customOptions?.maxAcceptableAccuracyMeters ?? baseTolerances.maxAcceptableAccuracyMeters;
  const maxAge = customOptions?.maxLocationAgeMs ?? baseTolerances.maxLocationAgeMs;

  if (reading.accuracy > maxAccuracy) return false;

  const now = Date.now();
  const age = now - reading.timestamp;
  // Permitir lecturas con edad máxima acorde al tier y margen para timestamps ligeramente en el futuro por drift de reloj
  if (age > maxAge || age < -5000) return false;

  return true;
}

