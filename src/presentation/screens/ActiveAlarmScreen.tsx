import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SlideToDismiss } from '../components/SlideToDismiss';
import { useAlarmStore } from '../store/useAlarmStore';
import { alarmSoundService } from '../../services/audio/alarmSoundService';

export const ActiveAlarmScreen: React.FC = () => {
  const activeAlarm = useAlarmStore((s) => s.activeRingingAlarm);
  const distance = useAlarmStore((s) => s.distanceToTargetMeters);
  const dismissCurrentAlarm = useAlarmStore((s) => s.dismissCurrentAlarm);

  useEffect(() => {
    activateKeepAwakeAsync();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  const handleDismiss = async () => {
    await alarmSoundService.stopAlarm();
    dismissCurrentAlarm();
  };

  if (!activeAlarm) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A154B" />

      <View style={styles.badgePulse}>
        <MaterialCommunityIcons name="bell-ring" size={80} color="#10B981" />
      </View>

      <Text style={styles.title}>¡LLEGASTE A TU DESTINO!</Text>
      <Text style={styles.alarmName}>{activeAlarm.name}</Text>
      <Text style={styles.destinationSubtitle}>
        {activeAlarm.destination.address || activeAlarm.destination.name}
      </Text>

      <View style={styles.distanceBox}>
        <Text style={styles.distanceLabel}>Distancia</Text>
        <Text style={styles.distanceValue}>{distance !== null ? `${distance} m` : 'En rango'}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <SlideToDismiss onDismiss={handleDismiss} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12071F',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  badgePulse: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2D104E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#34D399',
    textAlign: 'center',
  },
  alarmName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  destinationSubtitle: {
    fontSize: 14,
    color: '#D8B4FE',
    textAlign: 'center',
  },
  distanceBox: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#1E0B36',
    borderWidth: 1,
    borderColor: '#7E22CE',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#C084FC',
    textTransform: 'uppercase',
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 4,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
});
