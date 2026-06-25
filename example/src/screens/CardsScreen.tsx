import { Button } from '@vritti/quantum-ui-native/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@vritti/quantum-ui-native/Card';
import { CardPressable } from '@vritti/quantum-ui-native/CardPressable';
import type { PlatformIconDescriptor } from '@vritti/quantum-ui-native/DynamicIcon';
import { COMMON_ICONS, DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
import { Text } from '@vritti/quantum-ui-native/Text';
import { ScrollView, View } from 'react-native';
import { Section } from '../components/Section';

const SCREEN_ICONS: Record<string, PlatformIconDescriptor> = {
  account: { sfSymbol: 'person.crop.circle', materialSymbol: 'person' },
  alert: COMMON_ICONS.alertError,
  bell: { sfSymbol: 'bell', materialSymbol: 'notifications' },
  mail: { sfSymbol: 'envelope', materialSymbol: 'mail' },
  phone: { sfSymbol: 'phone', materialSymbol: 'phone' },
  settings: { sfSymbol: 'gearshape', materialSymbol: 'settings' },
  upload: { sfSymbol: 'square.and.arrow.up', materialSymbol: 'upload' },
};

// Small leading-icon helper used in the ListItem demos.
function LeadingIcon({ icon }: { icon: PlatformIconDescriptor }) {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-lg bg-muted">
      <DynamicIcon icon={icon} size={18} className="text-muted-foreground" />
    </View>
  );
}

export default function CardsScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 pb-6 gap-6">
      <Text variant="h2" className="text-foreground">
        Cards
      </Text>

      {/* Card compound — the primary primitive. iOS hairline border / Android elevation. */}
      <Section title="Card (compound)">
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
        <Card loading>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
        </Card>
      </Section>

      {/* CardPressable — interactive container. iOS opacity dim / Android ripple. */}
      <Section title="CardPressable (interactive)">
        <CardPressable onPress={() => {}} className="rounded-xl border border-border bg-card p-4">
          <Text className="font-medium">Tap me</Text>
          <Text variant="muted">Press feedback is platform-native (opacity on iOS, ripple on Android).</Text>
        </CardPressable>
        <CardPressable onPress={() => {}} selected className="rounded-xl bg-card p-4">
          <Text className="font-medium">Selected</Text>
          <Text variant="muted">Selected variant uses primary tint + border.</Text>
        </CardPressable>
      </Section>

      {/* ListItem — single primitive replaces SettingsRowCard / BannerCard / ListItemCard. */}
      <Section title="ListItem — settings row group">
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <ListItem
            leading={<LeadingIcon icon={SCREEN_ICONS.bell} />}
            title="Notifications"
            description="Manage alerts"
            onPress={() => {}}
            className="border-b border-border"
          />
          <ListItem
            leading={<LeadingIcon icon={SCREEN_ICONS.settings} />}
            title="Preferences"
            onPress={() => {}}
            className="border-b border-border"
          />
          <ListItem
            leading={<LeadingIcon icon={SCREEN_ICONS.account} />}
            title="Account"
            description="Profile & security"
            onPress={() => {}}
          />
        </View>
      </Section>

      <Section title="ListItem — banner pattern">
        <View className="rounded-xl border border-border bg-card">
          <ListItem
            leading={<DynamicIcon icon={COMMON_ICONS.info} size={18} className="text-info" />}
            title="Your trial expires in 3 days"
            trailing={
              <CardPressable onPress={() => {}} className="h-8 w-8 items-center justify-center rounded-full">
                <DynamicIcon icon={COMMON_ICONS.close} size={14} className="text-muted-foreground" />
              </CardPressable>
            }
          />
        </View>
      </Section>

      <Section title="ListItem — order list">
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <ListItem
            leading={<View className="h-2 w-2 rounded-full bg-success" />}
            title="Order #1234"
            description="Shipped"
            meta="2h ago"
            trailing={
              <View className="rounded-full bg-primary px-2 py-0.5">
                <Text className="text-xs text-primary-foreground">NEW</Text>
              </View>
            }
            className="border-b border-border"
          />
          <ListItem
            leading={<View className="h-2 w-2 rounded-full bg-warning" />}
            title="Order #1235"
            description="Processing"
            meta="5h ago"
            className="border-b border-border"
          />
          <ListItem
            leading={<View className="h-2 w-2 rounded-full bg-destructive" />}
            title="Order #1236"
            description="Cancelled"
          />
        </View>
        <ListItem loading title="" className="rounded-xl border border-border" />
      </Section>

      {/* Specialized cards — composed in the screen, not in the design system. */}
      <Section title="Stat tile (composed inline)">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Card className="gap-1">
              <CardContent>
                <Text variant="muted" className="text-xs">
                  Revenue
                </Text>
                <Text className="text-2xl font-bold">$12,450</Text>
                <Text className="text-xs text-success">+8.2%</Text>
              </CardContent>
            </Card>
          </View>
          <View className="flex-1">
            <Card className="gap-1">
              <CardContent>
                <Text variant="muted" className="text-xs">
                  Errors
                </Text>
                <Text className="text-2xl font-bold">23</Text>
                <Text className="text-xs text-destructive">-3%</Text>
              </CardContent>
            </Card>
          </View>
        </View>
      </Section>

      <Section title="Profile (composed inline)">
        <Card className="items-center gap-4 p-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Text className="text-lg font-bold text-primary-foreground">JD</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-[17px] font-semibold">Jane Doe</Text>
            <Text className="text-[13px] text-muted-foreground">Product Designer</Text>
          </View>
          <View className="flex-row gap-2">
            <CardPressable onPress={() => {}} className="h-9 w-9 items-center justify-center rounded-[10px] bg-muted">
              <DynamicIcon icon={SCREEN_ICONS.mail} size={18} className="text-muted-foreground" />
            </CardPressable>
            <CardPressable onPress={() => {}} className="h-9 w-9 items-center justify-center rounded-[10px] bg-muted">
              <DynamicIcon icon={SCREEN_ICONS.phone} size={18} className="text-muted-foreground" />
            </CardPressable>
          </View>
        </Card>
      </Section>

      <Section title="Action card (composed inline)">
        <Card className="items-center gap-4 p-6">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
            <DynamicIcon icon={SCREEN_ICONS.upload} size={24} className="text-muted-foreground" />
          </View>
          <View className="items-center gap-1">
            <Text className="text-[17px] font-semibold">Upload Documents</Text>
            <Text className="text-center text-[13px] text-muted-foreground">Drag and drop or click to upload</Text>
          </View>
          <Button onPress={() => {}} className="w-full">
            <Text>Choose Files</Text>
          </Button>
        </Card>
      </Section>

      {/* FlashList — uses ListItem for default skeleton. */}
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
              { id: '1', title: 'Invoice #1042', subtitle: 'Acme Corp', meta: '$2,400', statusColor: 'bg-success' },
              { id: '2', title: 'Invoice #1041', subtitle: 'Globex Ltd', meta: '$890', statusColor: 'bg-warning' },
              { id: '3', title: 'Invoice #1040', subtitle: 'Initech', meta: '$3,100', statusColor: 'bg-success' },
              { id: '4', title: 'Invoice #1039', subtitle: 'Umbrella Co', meta: '$540', statusColor: 'bg-destructive' },
            ]}
            renderItem={({ item }) => (
              <ListItem
                leading={<View className={`h-2 w-2 rounded-full ${item.statusColor}`} />}
                title={item.title}
                description={item.subtitle}
                meta={item.meta}
                className="mb-2 rounded-xl border border-border"
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Section>
    </ScrollView>
  );
}
