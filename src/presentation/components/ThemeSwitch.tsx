import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ThemeSwitchProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ isDarkMode, onToggle }) => {
  const animValue = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 50,
    }).start();
  }, [isDarkMode]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onToggle();
  };

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#73C0FC', '#183153'],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 32],
  });

  const sunOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.2],
  });

  const moonOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  const sunRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.container}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDarkMode }}
      accessibilityLabel="Alternar Modo Claro / Modo Oscuro"
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        {/* Ícono de Luna (Izquierda) */}
        <Animated.View style={[styles.moonIconContainer, { opacity: moonOpacity }]}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#73C0FC" />
        </Animated.View>

        {/* Ícono de Sol (Derecha) */}
        <Animated.View
          style={[
            styles.sunIconContainer,
            {
              opacity: sunOpacity,
              transform: [{ rotate: sunRotate }],
            },
          ]}
        >
          <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#FFD43B" />
        </Animated.View>

        {/* Círculo deslizante (Thumb) */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 34,
    justifyContent: 'center',
  },
  track: {
    width: 64,
    height: 34,
    borderRadius: 17,
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moonIconContainer: {
    position: 'absolute',
    left: 7,
    top: 6,
    zIndex: 1,
  },
  sunIconContainer: {
    position: 'absolute',
    right: 7,
    top: 6,
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});
