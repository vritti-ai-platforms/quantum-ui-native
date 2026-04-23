import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type StorybookSliderFallbackProps = {
  maximumValue?: number;
  minimumValue?: number;
  onSlidingComplete?: (value: number) => void;
  step?: number;
  style?: StyleProp<ViewStyle>;
  value?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toString() : '--';
}

export default function StorybookSliderFallback({
  maximumValue = 100,
  minimumValue = 0,
  style,
  value = 0,
}: StorybookSliderFallbackProps) {
  const normalizedMax = Math.max(maximumValue, minimumValue);
  const normalizedValue = clamp(value, minimumValue, normalizedMax);
  const range = normalizedMax - minimumValue;
  const progress =
    range > 0 ? ((normalizedValue - minimumValue) / range) * 100 : 0;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityState={{ disabled: true }}
      style={[styles.container, style]}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.row}>
        <Text style={styles.valueLabel}>
          Value {formatNumber(normalizedValue)}
        </Text>
        <Text style={styles.rangeLabel}>
          {formatNumber(minimumValue)} - {formatNumber(normalizedMax)}
        </Text>
      </View>
      <Text style={styles.note}>
        Range controls are unavailable in this embedded Storybook build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
  fill: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    height: '100%',
  },
  note: {
    color: '#6b7280',
    fontSize: 12,
  },
  rangeLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    backgroundColor: '#d1d5db',
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  valueLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
});
