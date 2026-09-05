import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { calculateHaversineDistanceMeters } from './haversine';
import { isLocationReadingValid } from './gpsFilter';
import { alarmSoundService } from '../audio/alarmSoundService';
import { useAlarmStore } from '../../presentation/store/useAlarmStore';
import { PollingTier } from '../../domain/models/location';

export const GEOFENCE_BACKGROUND_TASK_NAME = 'GEOALARM_LOCATION_TRACKER_TASK';

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

  if (!isLocationReadingValid(reading)) return;

  const store = useAlarmStore.getState();
  const activeAlarms = store.alarms.filter((a) => a.isActive);

  if (activeAlarms.length === 0) return;

  let minDistance = Infinity;
  let nearestAlarm = activeAlarms[0];

  for (const alarm of activeAlarms) {
    const dist = calculateHaversineDistanceMeters(
      reading.latitude,
      reading.longitude,
      alarm.destination.latitude,
      alarm.destination.longitude
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearestAlarm = alarm;
    }

    if (dist <= alarm.radiusMeters) {
      if (!store.isAlarmRinging) {
        store.triggerAlarmActive(alarm, dist);
        await alarmSoundService.triggerAlarm(alarm.audioConfig);
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
