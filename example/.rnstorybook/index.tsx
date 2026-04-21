import '../../example/global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetHost } from '../../lib/components/BottomSheet';
import { ThemeProvider } from '../../lib/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

let StorybookUIRoot: (() => React.JSX.Element) | null = null;

try {
  const { view } = require('./storybook.requires');
  StorybookUIRoot = view.getStorybookUI({
    storage: {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
    },
  });
} catch (error) {
  console.error('[Storybook] Failed to initialize:', error);
}

export default function StorybookRoot() {
  if (!StorybookUIRoot) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider defaultScheme="light">
          <View style={styles.content}>
            <StorybookUIRoot />
          </View>
          <BottomSheetHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
