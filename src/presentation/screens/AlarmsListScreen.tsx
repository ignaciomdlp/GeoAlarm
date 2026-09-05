import React from 'react';
import { View, Text, FlatList, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlarmStore } from '../store/useAlarmStore';

export const AlarmsListScreen: React.FC = () => {
  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);
  const distance = useAlarmStore((s) => s.distanceToTargetMeters);
  const isTracking = useAlarmStore((s) => s.isTrackingServiceActive);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Alarmas</Text>
        {isTracking && (
          <View style={styles.trackingBadge}>
            <MaterialCommunityIcons name="radar" size={16} color="#10B981" />
            <Text style={styles.trackingText}>
              {distance !== null ? `${distance} m restantes` : 'GPS Activo'}
            </Text>
          </View>
        )}
      </View>

      {alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="map-marker-distance" size={70} color="#6B21A8" />
          <Text style={styles.emptyTitle}>No tienes alarmas configuradas</Text>
          <Text style={styles.emptySubtitle}>
            Toca el botón (+) en la esquina inferior para crear una alarma hacia tu parada de metro o micro.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmName}>{item.name}</Text>
                  <Text style={styles.destinationText} numberOfLines={1}>
                    {item.destination.address || item.destination.name}
                  </Text>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleAlarm(item.id)}
                  trackColor={{ false: '#4A154B', true: '#10B981' }}
                  thumbColor={item.isActive ? '#FFFFFF' : '#A855F7'}
                />
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.chip}>
                  <MaterialCommunityIcons name="radius" size={14} color="#34D399" />
                  <Text style={styles.chipText}>Radio: {item.radiusMeters} m</Text>
                </View>

                <TouchableOpacity onPress={() => removeAlarm(item.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12071F',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E0B36',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  trackingText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E9D5FF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A855F7',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E0B36',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#4A154B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationText: {
    fontSize: 13,
    color: '#C084FC',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2D104E',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D104E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
});
