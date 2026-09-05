import { LocationReading } from '../../domain/models/location';

export interface GpsFilterOptions {
  maxAcceptableAccuracyMeters: number;
  maxLocationAgeMs: number;
}

const DEFAULT_OPTIONS: GpsFilterOptions = {
  maxAcceptableAccuracyMeters: 50,
  maxLocationAgeMs: 10000,
};

export function isLocationReadingValid(
  reading: LocationReading,
  options: GpsFilterOptions = DEFAULT_OPTIONS
): boolean {
  const now = Date.now();
  if (reading.accuracy > options.maxAcceptableAccuracyMeters) return false;
  const age = now - reading.timestamp;
  if (age > options.maxLocationAgeMs || age < -2000) return false;
  if (reading.latitude < -90 || reading.latitude > 90 || reading.longitude < -180 || reading.longitude > 180) {
    return false;
  }
  return true;
}
