import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Text';
import { Progress } from '@vritti/quantum-ui-native/Progress';
import { Separator } from '@vritti/quantum-ui-native/Separator';
import { Skeleton } from '@vritti/quantum-ui-native/Skeleton';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import {
  FormLabel,
  Chip,
  StatusDot,
  SectionHeader,
  CountBadge,
  TagGroup,
  KeyValue,
} from '@vritti/quantum-ui-native/Label';
import { Section } from '../components/Section';

export default function FeedbackScreen() {
  const [chips, setChips] = useState([
    'React Native',
    'NativeWind',
    'Tailwind',
  ]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-5 pb-6 gap-6"
    >
      <Text variant="h2" className="text-foreground">
        Feedback
      </Text>

      {/* Progress */}
      <Section title="Progress">
        <Progress value={65} />
        <Progress value={30} indicatorClassName="bg-success" />
        <Progress value={90} indicatorClassName="bg-destructive" />
      </Section>

      {/* Separator */}
      <Section title="Separator">
        <Text variant="muted">Above</Text>
        <Separator />
        <Text variant="muted">Below</Text>
        <View className="flex-row items-center gap-3 h-6">
          <Text variant="muted">Left</Text>
          <Separator orientation="vertical" />
          <Text variant="muted">Right</Text>
        </View>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <View className="gap-3">
          <View className="flex-row gap-3 items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <View className="gap-2 flex-1">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </View>
          </View>
          <Skeleton className="h-24 w-full rounded-lg" />
        </View>
      </Section>

      {/* Spinner */}
      <Section title="Spinner">
        <View className="flex-row gap-6 items-center">
          <Spinner size="small" />
          <Spinner size="large" />
        </View>
      </Section>

      {/* FormLabel */}
      <Section title="Form Label">
        <FormLabel label="Email Address" required />
        <FormLabel label="Optional Field" />
      </Section>

      {/* Chip */}
      <Section title="Chips">
        <View className="flex-row flex-wrap gap-2">
          {chips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              onRemove={() => setChips((c) => c.filter((t) => t !== chip))}
            />
          ))}
          <Chip label="Read-only" />
        </View>
      </Section>

      {/* StatusDot */}
      <Section title="Status Dot">
        <View className="flex-row gap-4">
          <StatusDot label="Online" />
          <StatusDot label="Away" color="bg-warning" />
          <StatusDot label="Offline" color="bg-destructive" />
        </View>
      </Section>

      {/* SectionHeader */}
      <Section title="Section Header">
        <SectionHeader
          title="Recent Activity"
          actionLabel="See All"
          onAction={() => {}}
        />
      </Section>

      {/* CountBadge */}
      <Section title="Count Badge">
        <View className="flex-row gap-3 items-center">
          <CountBadge count={3} />
          <CountBadge count={99} />
        </View>
      </Section>

      {/* TagGroup */}
      <Section title="Tag Group">
        <TagGroup tags={['React', 'TypeScript', 'NativeWind', 'Tailwind v4']} />
      </Section>

      {/* KeyValue */}
      <Section title="Key Value">
        <View className="flex-row gap-6">
          <KeyValue label="Status" value="Active" />
          <KeyValue label="Created" value="Jan 15, 2026" />
          <KeyValue label="Plan" value="Pro" />
        </View>
      </Section>
    </ScrollView>
  );
}
