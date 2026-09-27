import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface DistanceSliderProps {
  value: number; // 50 to 2000
  onValueChange: (val: number) => void;
  accentColor?: string;
  trackBgColor?: string;
  textColor?: string;
}

const MIN_VAL = 50;
const MAX_VAL = 2000;
const STEP = 25;

export const DistanceSlider: React.FC<DistanceSliderProps> = ({
  value,
  onValueChange,
  accentColor = '#10B981',
  trackBgColor = '#2D104E',
  textColor = '#D8B4FE',
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const lastHapticStep = useRef<number>(Math.round(value / 100));

  const clampAndRound = (val: number) => {
    const clamped = Math.max(MIN_VAL, Math.min(MAX_VAL, val));
    return Math.round(clamped / STEP) * STEP;
  };

  const updateFromPosition = (xPos: number) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, xPos / trackWidth));
    const calculated = MIN_VAL + ratio * (MAX_VAL - MIN_VAL);
    const rounded = clampAndRound(calculated);
    
    const stepBucket = Math.round(rounded / 100);
    if (stepBucket !== lastHapticStep.current) {
      lastHapticStep.current = stepBucket;
      try {
        Haptics.selectionAsync();
      } catch {}
    }
    
    onValueChange(rounded);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        updateFromPosition(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const xPos = evt.nativeEvent.locationX + gestureState.dx;
        updateFromPosition(xPos);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const ratio = Math.max(0, Math.min(1, (value - MIN_VAL) / (MAX_VAL - MIN_VAL)));
  const thumbLeft = Math.max(0, ratio * (trackWidth - 26));

  return (
    <View style={styles.container}>
      <View
        ref={trackRef}
        style={[styles.trackContainer, { backgroundColor: trackBgColor }]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Barra de progreso rellena */}
        <View
          style={[
            styles.filledTrack,
            {
              width: `${ratio * 100}%`,
              backgroundColor: accentColor,
            },
          ]}
        />

        {/* Círculo deslizante (Thumb) */}
        <View
          style={[
            styles.thumb,
            {
              left: thumbLeft,
              borderColor: accentColor,
            },
          ]}
        />
      </View>

      {/* Rótulos de extremos */}
      <View style={styles.labelsRow}>
        <Text style={[styles.limitLabel, { color: textColor }]}>50 m</Text>
        <Text style={[styles.limitLabel, { color: textColor }]}>1 km</Text>
        <Text style={[styles.limitLabel, { color: textColor }]}>2 km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  trackContainer: {
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    position: 'relative',
    paddingHorizontal: 13,
  },
  filledTrack: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  limitLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
