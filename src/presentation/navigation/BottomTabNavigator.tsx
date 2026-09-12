import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlarmsListScreen } from '../screens/AlarmsListScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ActiveAlarmScreen } from '../screens/ActiveAlarmScreen';
import { CreateAlarmModal } from '../components/CreateAlarmModal';
import { useAlarmStore } from '../store/useAlarmStore';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const isAlarmRinging = useAlarmStore((s) => s.isAlarmRinging);
  const isCreateModalOpen = useAlarmStore((s) => s.isCreateModalOpen);
  const editingAlarm = useAlarmStore((s) => s.editingAlarm);
  const openCreateModal = useAlarmStore((s) => s.openCreateModal);
  const closeCreateModal = useAlarmStore((s) => s.closeCreateModal);
  const [currentTab, setCurrentTab] = useState<'Alarms' | 'Map' | 'Profile'>('Alarms');

  if (isAlarmRinging) {
    return <ActiveAlarmScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.floatingTabBar,
          tabBarShowLabel: false,
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
              <MaterialCommunityIcons
                name="alarm-multiple"
                size={26}
                color={focused ? '#10B981' : '#A855F7'}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity {...props} style={styles.elevatedCenterButton} activeOpacity={0.85}>
                <View style={styles.centerIconGradient}>
                  <MaterialCommunityIcons name="map-marker-radius" size={32} color="#FFFFFF" />
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
              <MaterialCommunityIcons
                name="account-cog"
                size={26}
                color={focused ? '#10B981' : '#A855F7'}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {currentTab !== 'Profile' && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={() => openCreateModal(null)}
        >
          <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
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
  floatingTabBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#1E0B36',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#4A154B',
    elevation: 8,
    paddingHorizontal: 16,
  },
  elevatedCenterButton: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#7E22CE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
    elevation: 10,
  },
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 9,
  },
});
