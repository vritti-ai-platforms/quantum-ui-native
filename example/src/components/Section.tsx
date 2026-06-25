import React from 'react';
import { View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Text';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text variant="h3" className="text-foreground">
        {title}
      </Text>
      {children}
      <View className="mt-2 h-px bg-border" />
    </View>
  );
}
