import React from 'react';
import { View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Text';
import { Separator } from '@vritti/quantum-ui-native/Separator';

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
      <Separator className="mt-2" />
    </View>
  );
}
