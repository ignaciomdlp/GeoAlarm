import React from 'react';
import { View, Text, FlatList, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlarmStore } from '../store/useAlarmStore';
import { Alarm, AVAILABLE_SOUNDS } from '../../domain/models/alarm';
import { COLORS } from '../theme/colors';

export const AlarmsListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);
  const openCreateModal = useAlarmStore((s) => s.openCreateModal);
  const distance = useAlarmStore((s) => s.distanceToTargetMeters);
  const currentTier = useAlarmStore((s) => s.currentTier);
  const isTracking = useAlarmStore((s) => s.isTrackingServiceActive);
  const isDarkMode = useAlarmStore((s) => s.isDarkMode);

  const theme = COLORS[isDarkMode ? 'dark' : 'light'];
  const bottomBarPadding = Math.max(insets.bottom, 10);

  const confirmDelete = (alarm: Alarm) => {
    Alert.alert(
      'Eliminar Alarma',
      `¿Seguro que deseas eliminar la alarma "${alarm.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeAlarm(alarm.id),
        },
      ]
    );
  };

  const getSoundLabel = (alarm: Alarm) => {
    if (alarm.audioConfig?.customSoundName) {
      return alarm.audioConfig.customSoundName;
    }
    const found = AVAILABLE_SOUNDS.find((s) => s.id === alarm.audioConfig?.soundKey);
    return found ? found.name : 'Alarma Digital 1';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Mis Alarmas</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {alarms.filter((a) => a.isActive).length} activas de {alarms.length}
          </Text>
        </View>

        {isTracking && (
          <View style={[styles.trackingBadge, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
            <MaterialCommunityIcons
              name="radar"
              size={16}
              color={isDarkMode ? theme.accent : theme.accentDark}
            />
            <Text
              style={[
                styles.trackingText,
                { color: isDarkMode ? theme.accent : theme.accentDark },
              ]}
            >
              {distance !== null ? `${distance} m restantes (${currentTier})` : 'GPS Activo'}
            </Text>
          </View>
        )}
      </View>

      {alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={70}
            color={isDarkMode ? theme.primary : theme.primaryDark}
          />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No tienes alarmas configuradas
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Toca el botón (+) flotante para crear una alarma hacia tu parada de metro o micro.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 130 + bottomBarPadding }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: item.isActive ? theme.accent : theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.alarmName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text
                    style={[styles.destinationText, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.destination.address || item.destination.name}
                  </Text>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleAlarm(item.id)}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={item.isActive ? (isDarkMode ? '#FFFFFF' : '#064E3B') : '#A855F7'}
                />
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.chipsRow}>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="radius"
                      size={13}
                      color={isDarkMode ? theme.accentLight : theme.accentDark}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkMode ? theme.accentLight : theme.accentDark },
                      ]}
                    >
                      {item.radiusMeters >= 1000 ? `${item.radiusMeters / 1000} km` : `${item.radiusMeters} m`}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="music-note"
                      size={13}
                      color={isDarkMode ? '#C084FC' : theme.primary}
                    />
                    <Text
                      style={[
                        styles.chipSecondaryText,
                        { color: isDarkMode ? '#C084FC' : theme.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {getSoundLabel(item)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => openCreateModal(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={20}
                      color={isDarkMode ? '#A855F7' : theme.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => confirmDelete(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
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
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alarmName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  destinationText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
});
