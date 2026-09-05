import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomTabNavigator } from './src/presentation/navigation/BottomTabNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <BottomTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
