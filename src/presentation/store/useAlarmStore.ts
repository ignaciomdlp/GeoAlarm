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
  isCreateModalOpen: boolean;
  editingAlarm: Alarm | null;

  openCreateModal: (alarm?: Alarm | null) => void;
  closeCreateModal: () => void;
  addAlarm: (alarm: Alarm) => Promise<void>;
  updateAlarm: (id: AlarmId, updates: Partial<Alarm>) => Promise<void>;
  removeAlarm: (id: AlarmId) => Promise<void>;
  toggleAlarm: (id: AlarmId) => Promise<void>;
  triggerAlarmActive: (alarm: Alarm, distance: number) => void;
  dismissCurrentAlarm: () => Promise<void>;
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
      isCreateModalOpen: false,
      editingAlarm: null,

      openCreateModal: (alarm = null) => {
        set({ isCreateModalOpen: true, editingAlarm: alarm });
      },

      closeCreateModal: () => {
        set({ isCreateModalOpen: false, editingAlarm: null });
      },

      addAlarm: async (alarm: Alarm) => {
        const updated = [...get().alarms, alarm];
        set({ alarms: updated });

        if (alarm.isActive) {
          await geofencingService.startTracking();
          set({ isTrackingServiceActive: true });
        }
      },

      updateAlarm: async (id: AlarmId, updates: Partial<Alarm>) => {
        const updated = get().alarms.map((a) =>
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        );
        set({ alarms: updated });

        const anyActive = updated.some((a) => a.isActive);
        if (anyActive && !get().isTrackingServiceActive) {
          await geofencingService.startTracking();
          set({ isTrackingServiceActive: true });
        } else if (!anyActive && get().isTrackingServiceActive) {
          await geofencingService.stopTracking();
          set({ isTrackingServiceActive: false, distanceToTargetMeters: null });
        }
      },

      removeAlarm: async (id: AlarmId) => {
        const updated = get().alarms.filter((a) => a.id !== id);
        set({ alarms: updated });

        const anyActive = updated.some((a) => a.isActive);
        if (!anyActive) {
          await geofencingService.stopTracking();
          set({ isTrackingServiceActive: false, distanceToTargetMeters: null });
        }
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

      dismissCurrentAlarm: async () => {
        const ringing = get().activeRingingAlarm;
        let updatedAlarms = get().alarms;
        if (ringing) {
          updatedAlarms = updatedAlarms.map((a) =>
            a.id === ringing.id ? { ...a, isActive: false, updatedAt: new Date().toISOString() } : a
          );
        }

        set({
          alarms: updatedAlarms,
          isAlarmRinging: false,
          activeRingingAlarm: null,
        });

        const anyActive = updatedAlarms.some((a) => a.isActive);
        if (!anyActive) {
          await geofencingService.stopTracking();
          set({ isTrackingServiceActive: false, distanceToTargetMeters: null, currentTier: 'FAR' });
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
