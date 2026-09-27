import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlarmsListScreen } from '../screens/AlarmsListScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ActiveAlarmScreen } from '../screens/ActiveAlarmScreen';
import { CreateAlarmModal } from '../components/CreateAlarmModal';
import { useAlarmStore } from '../store/useAlarmStore';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const isAlarmRinging = useAlarmStore((s) => s.isAlarmRinging);
  const isDarkMode = useAlarmStore((s) => s.isDarkMode);
  const isCreateModalOpen = useAlarmStore((s) => s.isCreateModalOpen);
  const editingAlarm = useAlarmStore((s) => s.editingAlarm);
  const openCreateModal = useAlarmStore((s) => s.openCreateModal);
  const closeCreateModal = useAlarmStore((s) => s.closeCreateModal);
  const [currentTab, setCurrentTab] = useState<'Alarms' | 'Map' | 'Profile'>('Alarms');

  const theme = COLORS[isDarkMode ? 'dark' : 'light'];
  const bottomBarPadding = Math.max(insets.bottom, 10);
  const barHeight = 64 + bottomBarPadding;

  if (isAlarmRinging) {
    return <ActiveAlarmScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.dockedTabBar,
            {
              height: barHeight,
              paddingBottom: bottomBarPadding,
              backgroundColor: theme.tabBarBackground,
              borderColor: theme.border,
            },
          ],
        }}
        screenListeners={{
          state: (e) => {
            const index = e.data.state.index;
            const routeName = e.data.state.routeNames[index];
            setCurrentTab(routeName as any);
          },
        }}
      >
        <Tab.Screen
          name="Alarms"
          component={AlarmsListScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconTabWrap}>
                <MaterialCommunityIcons
                  name="alarm-multiple"
                  size={26}
                  color={focused ? (isDarkMode ? theme.accent : theme.primary) : theme.textSecondary}
                />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                style={styles.elevatedCenterButton}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.centerIconCircle,
                    {
                      backgroundColor: isDarkMode ? theme.primary : theme.surfaceElevated,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    size={30}
                    color={isDarkMode ? '#FFFFFF' : theme.primary}
                  />
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconTabWrap}>
                <MaterialCommunityIcons
                  name="account-cog"
                  size={26}
                  color={focused ? (isDarkMode ? theme.accent : theme.primary) : theme.textSecondary}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Botón flotante para crear nueva alarma (Apilado verticalmente sobre el botón de ubicación en el mapa) */}
      {currentTab !== 'Profile' && (
        <TouchableOpacity
          style={[
            styles.fabButton,
            {
              backgroundColor: theme.accent,
              bottom: barHeight + 72, // Queda claramente por sobre el botón de centrar mapa
            },
          ]}
          activeOpacity={0.85}
          onPress={() => openCreateModal(null)}
        >
          <MaterialCommunityIcons
            name="plus"
            size={32}
            color={isDarkMode ? '#1E0B36' : '#064E3B'}
          />
        </TouchableOpacity>
      )}

      <CreateAlarmModal
        visible={isCreateModalOpen}
        onClose={closeCreateModal}
        alarmToEdit={editingAlarm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dockedTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  iconTabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  elevatedCenterButton: {
    top: -12, // Sobresale solo un ~20%, teniendo más del 70% dentro de la barra
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    zIndex: 999,
  },
});
