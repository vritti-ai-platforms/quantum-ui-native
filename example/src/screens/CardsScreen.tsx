import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Button } from '@vritti/quantum-ui-native/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  BannerCard,
  BasicCard,
  SettingsRowCard,
  StatCard,
  ProfileCard,
  ListItemCard,
  ActionCard,
} from '@vritti/quantum-ui-native/Card';
import type { PlatformIconDescriptor } from '@vritti/quantum-ui-native/DynamicIcon';
import { COMMON_ICONS } from '@vritti/quantum-ui-native/DynamicIcon';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { Section } from '../components/Section';

const SCREEN_ICONS: Record<string, PlatformIconDescriptor> = {
  account: { sfSymbol: 'person.crop.circle', materialIcon: 'person' },
  alert: COMMON_ICONS.alertError,
  bell: { sfSymbol: 'bell', materialIcon: 'notifications' },
  mail: { sfSymbol: 'envelope', materialIcon: 'mail' },
  phone: { sfSymbol: 'phone', materialIcon: 'phone' },
  settings: { sfSymbol: 'gearshape', materialIcon: 'settings' },
  upload: { sfSymbol: 'square.and.arrow.up', materialIcon: 'upload' },
};

export default function CardsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-5 pb-6 gap-6"
    >
      <Text variant="h2" className="text-foreground">
        Cards
      </Text>

      {/* Card compound */}
      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text>This is the card content area.</Text>
          </CardContent>
          <CardFooter>
            <Button size="sm">
              <Text>Action</Text>
            </Button>
          </CardFooter>
        </Card>
      </Section>

      {/* BannerCard */}
      <Section title="Banner Card">
        <BannerCard message="Your trial expires in 3 days" onClose={() => {}} />
        <BannerCard
          icon={SCREEN_ICONS.alert}
          message="Action required: verify your email"
          onPress={() => {}}
        />
        <BannerCard message="" isLoading />
      </Section>

      {/* BasicCard */}
      <Section title="Basic Card">
        <BasicCard
          title="Getting Started"
          description="Learn the basics of the platform"
        >
          <Text variant="muted">Card content goes here.</Text>
        </BasicCard>
        <BasicCard
          title="With Footer"
          footer={
            <Button size="sm">
              <Text>Go</Text>
            </Button>
          }
        />
        <BasicCard isLoading title="" />
      </Section>

      {/* SettingsRowCard */}
      <Section title="Settings Row Card">
        <SettingsRowCard
          icon={SCREEN_ICONS.bell}
          label="Notifications"
          description="Manage alerts"
          onPress={() => {}}
        />
        <SettingsRowCard
          icon={SCREEN_ICONS.settings}
          label="Preferences"
          onPress={() => {}}
        />
        <SettingsRowCard
          icon={SCREEN_ICONS.account}
          label="Account"
          description="Profile & security"
          onPress={() => {}}
        />
        <SettingsRowCard isLoading label="" />
      </Section>

      {/* StatCard */}
      <Section title="Stat Card">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard
              label="Revenue"
              value="$12,450"
              trendValue="+8.2%"
              trendDirection="up"
            />
          </View>
          <View className="flex-1">
            <StatCard
              label="Errors"
              value={23}
              trendValue="-3%"
              trendDirection="down"
            />
          </View>
        </View>
        <StatCard isLoading label="" value="" />
      </Section>

      {/* ProfileCard */}
      <Section title="Profile Card">
        <ProfileCard
          initials="JD"
          name="Jane Doe"
          role="Product Designer"
          actions={[
            { icon: SCREEN_ICONS.mail, onPress: () => {} },
            { icon: SCREEN_ICONS.phone, onPress: () => {} },
          ]}
        />
        <ProfileCard isLoading initials="" name="" />
      </Section>

      {/* ListItemCard */}
      <Section title="List Item Card">
        <ListItemCard
          title="Order #1234"
          subtitle="Shipped"
          meta="2h ago"
          badge="NEW"
        />
        <ListItemCard
          title="Order #1235"
          subtitle="Processing"
          statusColor="bg-warning"
          meta="5h ago"
        />
        <ListItemCard
          title="Order #1236"
          subtitle="Cancelled"
          statusColor="bg-destructive"
        />
        <ListItemCard isLoading title="" />
      </Section>

      {/* FlashList */}
      <Section title="FlashList">
        <View className="h-56">
          <FlashList<{
            id: string;
            title: string;
            subtitle: string;
            meta: string;
            statusColor: string;
          }>
            data={[
              {
                id: '1',
                title: 'Invoice #1042',
                subtitle: 'Acme Corp',
                meta: '$2,400',
                statusColor: 'bg-success',
              },
              {
                id: '2',
                title: 'Invoice #1041',
                subtitle: 'Globex Ltd',
                meta: '$890',
                statusColor: 'bg-warning',
              },
              {
                id: '3',
                title: 'Invoice #1040',
                subtitle: 'Initech',
                meta: '$3,100',
                statusColor: 'bg-success',
              },
              {
                id: '4',
                title: 'Invoice #1039',
                subtitle: 'Umbrella Co',
                meta: '$540',
                statusColor: 'bg-destructive',
              },
            ]}
            renderItem={({ item }) => (
              <ListItemCard
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                statusColor={item.statusColor}
                className="mb-2"
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Section>

      {/* ActionCard */}
      <Section title="Action Card">
        <ActionCard
          icon={SCREEN_ICONS.upload}
          title="Upload Documents"
          description="Drag and drop or click to upload"
          actionLabel="Choose Files"
          onAction={() => {}}
        />
        <ActionCard isLoading title="" actionLabel="" />
      </Section>
    </ScrollView>
  );
}
