import React from 'react';
import { Text, View } from 'react-native';
import StorybookUIRoot from '../../.rnstorybook';

export default function StorybookScreen() {
  if (!StorybookUIRoot) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>
          Storybook failed to initialize. Check the bundler console for details.
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background">
      <StorybookUIRoot />
    </View>
  );
}
