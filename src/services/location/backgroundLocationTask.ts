import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateHaversineDistanceMeters } from './haversine';
import { isLocationReadingValid } from './gpsFilter';
import { alarmSoundService } from '../audio/alarmSoundService';
import { notificationService } from '../notifications/notificationService';
import { useAlarmStore } from '../../presentation/store/useAlarmStore';
import { PollingTier } from '../../domain/models/location';
import { Alarm } from '../../domain/models/alarm';
import { GEOFENCE_BACKGROUND_TASK_NAME } from './constants';

interface TaskData {
  locations?: Location.LocationObject[];
}

TaskManager.defineTask(GEOFENCE_BACKGROUND_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(`[BackgroundLocationTask] Error: ${error.message}`);
    return;
  }

  const taskData = data as TaskData;
  if (!taskData?.locations?.length) return;

  const latestLocation = taskData.locations[taskData.locations.length - 1];
  const reading = {
    latitude: latestLocation.coords.latitude,
    longitude: latestLocation.coords.longitude,
    accuracy: latestLocation.coords.accuracy ?? 999,
    altitude: latestLocation.coords.altitude,
    speed: latestLocation.coords.speed,
    timestamp: latestLocation.timestamp,
  };

  const store = useAlarmStore.getState();
  const currentTier = store.currentTier || 'FAR';

  if (!isLocationReadingValid(reading, currentTier)) return;

  let activeAlarms = store.alarms.filter((a) => a.isActive);

  // Mecanismo de seguridad contra pérdida de hidratación de Zustand en procesos en segundo plano
  if (activeAlarms.length === 0) {
    try {
      const persisted = await AsyncStorage.getItem('@placeoclock_alarms_storage');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const storedAlarms: Alarm[] = parsed?.state?.alarms || [];
        activeAlarms = storedAlarms.filter((a) => a.isActive);
      }
    } catch (e) {
      console.warn('[BackgroundLocationTask] Storage rehydration check failed:', e);
    }
  }

  if (activeAlarms.length === 0) return;

  let minDistance = Infinity;

  for (const alarm of activeAlarms) {
    const dist = calculateHaversineDistanceMeters(
      reading.latitude,
      reading.longitude,
      alarm.destination.latitude,
      alarm.destination.longitude
    );

    if (dist < minDistance) {
      minDistance = dist;
    }

    if (dist <= alarm.radiusMeters) {
      if (!store.isAlarmRinging) {
        store.triggerAlarmActive(alarm, dist);
        await Promise.all([
          alarmSoundService.triggerAlarm(alarm.audioConfig),
          notificationService.sendArrivalAlarmNotification(alarm.name, dist),
        ]);
      }
      return;
    }
  }

  let tier: PollingTier = 'FAR';
  if (minDistance <= 1000) {
    tier = 'CLOSE';
  } else if (minDistance <= 5000) {
    tier = 'MEDIUM';
  }

  store.updateTrackingMetrics(reading, minDistance, tier);
});