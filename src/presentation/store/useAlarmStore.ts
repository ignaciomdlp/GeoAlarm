import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmId } from '../../domain/models/alarm';
import { LocationReading, PollingTier } from '../../domain/models/location';
import { geofencingService } from '../../services/location/geofencingService';

interface AlarmState {
  alarms: Alarm[];
  activeRingingAlarm: Alarm | null;
  isAlarmRinging: boolean;
  isTrackingServiceActive: boolean;
  currentLocation: LocationReading | null;
  distanceToTargetMeters: number | null;
  currentTier: PollingTier;

  addAlarm: (alarm: Alarm) => void;
  removeAlarm: (id: AlarmId) => void;
  toggleAlarm: (id: AlarmId) => Promise<void>;
  triggerAlarmActive: (alarm: Alarm, distance: number) => void;
  dismissCurrentAlarm: () => void;
  updateTrackingMetrics: (location: LocationReading, distance: number, tier: PollingTier) => void;
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      activeRingingAlarm: null,
      isAlarmRinging: false,
      isTrackingServiceActive: false,
      currentLocation: null,
      distanceToTargetMeters: null,
      currentTier: 'FAR',

      addAlarm: (alarm: Alarm) => {
        set((state) => ({ alarms: [...state.alarms, alarm] }));
      },

      removeAlarm: (id: AlarmId) => {
        set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) }));
      },

      toggleAlarm: async (id: AlarmId) => {
        const currentAlarms = get().alarms;
        const updated = currentAlarms.map((a) =>
          a.id === id ? { ...a, isActive: !a.isActive, updatedAt: new Date().toISOString() } : a
        );
        set({ alarms: updated });

        const anyActive = updated.some((a) => a.isActive);
        if (anyActive) {
          await geofencingService.startTracking();
          set({ isTrackingServiceActive: true });
        } else {
          await geofencingService.stopTracking();
          set({ isTrackingServiceActive: false, distanceToTargetMeters: null });
        }
      },

      triggerAlarmActive: (alarm: Alarm, distance: number) => {
        set({
          isAlarmRinging: true,
          activeRingingAlarm: alarm,
          distanceToTargetMeters: distance,
          currentTier: 'TRIGGERED',
        });
      },

      dismissCurrentAlarm: () => {
        const ringing = get().activeRingingAlarm;
        if (ringing) {
          set((state) => ({
            alarms: state.alarms.map((a) => (a.id === ringing.id ? { ...a, isActive: false } : a)),
            isAlarmRinging: false,
            activeRingingAlarm: null,
          }));
        } else {
          set({ isAlarmRinging: false, activeRingingAlarm: null });
        }
      },

      updateTrackingMetrics: (location: LocationReading, distance: number, tier: PollingTier) => {
        const oldTier = get().currentTier;
        set({
          currentLocation: location,
          distanceToTargetMeters: distance,
          currentTier: tier,
        });

        if (oldTier !== tier) {
          geofencingService.applyTierSettings(tier).catch(console.error);
        }
      },
    }),
    {
      name: '@placeoclock_alarms_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ alarms: state.alarms }),
    }
  )
);
