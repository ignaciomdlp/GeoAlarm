import * as Location from 'expo-location';
import { GEOFENCE_BACKGROUND_TASK_NAME } from './constants';
import { PollingTier } from '../../domain/models/location';

class GeofencingService {
  public async startTracking(): Promise<boolean> {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') return false;

    const isRunning = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_BACKGROUND_TASK_NAME);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(GEOFENCE_BACKGROUND_TASK_NAME);
    }

    await this.applyTierSettings('FAR');
    return true;
  }

  public async stopTracking(): Promise<void> {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(GEOFENCE_BACKGROUND_TASK_NAME);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(GEOFENCE_BACKGROUND_TASK_NAME);
    }
  }

  public async applyTierSettings(tier: PollingTier): Promise<void> {
    let timeInterval = 45000;
    let distanceInterval = 150;
    let accuracy = Location.Accuracy.Balanced;

    if (tier === 'MEDIUM') {
      timeInterval = 15000;
      distanceInterval = 50;
      accuracy = Location.Accuracy.High;
    } else if (tier === 'CLOSE') {
      timeInterval = 3000;
      distanceInterval = 5;
      accuracy = Location.Accuracy.BestForNavigation;
    }

    await Location.startLocationUpdatesAsync(GEOFENCE_BACKGROUND_TASK_NAME, {
      accuracy,
      timeInterval,
      distanceInterval,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: 'PlaceO\'Clock Activo',
        notificationBody: 'Monitoreando distancia hacia tu destino...',
        notificationColor: '#7E22CE',
      },
    });
  }
}

export const geofencingService = new GeofencingService();
