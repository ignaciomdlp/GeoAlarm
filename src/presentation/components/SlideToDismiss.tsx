import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SlideToDismissProps {
  onDismiss: () => void;
  trackWidth?: number;
}

export const SlideToDismiss: React.FC<SlideToDismissProps> = ({
  onDismiss,
  trackWidth = 320,
}) => {
  const BUTTON_WIDTH = 64;
  const maxSlide = trackWidth - BUTTON_WIDTH - 8;
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= maxSlide) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= maxSlide * 0.75) {
          Animated.timing(pan, {
            toValue: maxSlide,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onDismiss();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            bounciness: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.track, { width: trackWidth }]}>
      <Text style={styles.trackText}>Desliza para apagar »»</Text>
      <Animated.View
        style={[styles.knob, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <MaterialCommunityIcons name="alarm-off" size={28} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 72,
    backgroundColor: '#2D104E',
    borderRadius: 36,
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  trackText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#34D399',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  knob: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
