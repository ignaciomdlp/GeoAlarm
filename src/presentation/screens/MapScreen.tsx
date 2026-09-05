import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlarmStore } from '../store/useAlarmStore';

export const MapScreen: React.FC = () => {
  const alarms = useAlarmStore((s) => s.alarms);
  const activeAlarms = alarms.filter((a) => a.isActive);

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <MaterialCommunityIcons name="map-legend" size={80} color="#7E22CE" />
        <Text style={styles.mapTitle}>Vista de Mapa OpenStreetMap</Text>
        <Text style={styles.mapSubtitle}>
          Tile Layer Carto/OSM configurada sin API Keys privativas.
        </Text>

        <View style={styles.activeGeofencesBox}>
          <Text style={styles.badgeTitle}>Geocercas Monitoreadas: {activeAlarms.length}</Text>
          {activeAlarms.map((alarm) => (
            <Text key={alarm.id} style={styles.geofenceItem}>
              🎯 {alarm.name} (Radio: {alarm.radiusMeters}m)
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12071F',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 16,
  },
  mapSubtitle: {
    fontSize: 13,
    color: '#C084FC',
    textAlign: 'center',
    marginTop: 6,
  },
  activeGeofencesBox: {
    marginTop: 24,
    backgroundColor: '#1E0B36',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  badgeTitle: {
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 8,
  },
  geofenceItem: {
    color: '#FFFFFF',
    fontSize: 13,
    marginVertical: 2,
  },
});
