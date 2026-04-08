import '../global.css';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  // Theme
  ThemeProvider,
  useTheme,
  // Typography
  Text,
  // Buttons
  Button,
  // Alerts
  Alert,
  // Avatar
  Avatar,
  AvatarImage,
  AvatarFallback,
  // Badge
  Badge,
  // Cards (compound)
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  // Card variants
  BannerCard,
  BasicCard,
  SettingsRowCard,
  StatCard,
  ProfileCard,
  ListItemCard,
  ActionCard,
  // Form inputs
  Checkbox,
  Input,
  TextField,
  TextArea,
  RadioGroup,
  RadioGroupItem,
  Switch,
  // Feedback
  Progress,
  Separator,
  Skeleton,
  Spinner,
  // Icons
  Icon,
  // Labels
  FormLabel,
  Chip,
  StatusDot,
  SectionHeader,
  CountBadge,
  TagGroup,
  KeyValue,
} from '@vritti/react-native-ui';
import {
  Bell,
  Mail,
  Phone,
  Upload,
  AlertCircle,
  Settings,
  User,
  Heart,
  Star,
  Moon,
  Sun,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react-native';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="h3" className="text-foreground">{title}</Text>
      {children}
      <Separator className="mt-2" />
    </View>
  );
}

function DemoContent() {
  const { isDark, toggleColorScheme } = useTheme();
  const [checkboxVal, setCheckboxVal] = useState(false);
  const [switchVal, setSwitchVal] = useState(false);
  const [radioVal, setRadioVal] = useState('free');
  const [progressVal] = useState(65);
  const [chips, setChips] = useState(['React Native', 'NativeWind', 'Tailwind']);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5 pb-20 gap-6">
      {/* Theme Toggle */}
      <View className="flex-row items-center justify-between">
        <Text variant="h2" className="text-foreground">Component Gallery</Text>
        <Button variant="outline" size="icon" onPress={toggleColorScheme}>
          <Icon as={isDark ? Sun : Moon} className="text-foreground" size={18} />
        </Button>
      </View>

      {/* Typography */}
      <Section title="Typography">
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="h4">Heading 4</Text>
        <Text variant="p">Paragraph text with default leading.</Text>
        <Text variant="lead">Lead paragraph text</Text>
        <Text variant="large">Large text</Text>
        <Text variant="small">Small text</Text>
        <Text variant="muted">Muted helper text</Text>
        <Text variant="code">const x = 42;</Text>
        <Text variant="blockquote">A blockquote for emphasis.</Text>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <View className="flex-row flex-wrap gap-2">
          <Button variant="default"><Text>Default</Text></Button>
          <Button variant="destructive"><Text>Destructive</Text></Button>
          <Button variant="outline"><Text>Outline</Text></Button>
          <Button variant="secondary"><Text>Secondary</Text></Button>
          <Button variant="ghost"><Text>Ghost</Text></Button>
          <Button variant="link"><Text>Link</Text></Button>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Button size="sm"><Text>Small</Text></Button>
          <Button size="default"><Text>Default</Text></Button>
          <Button size="lg"><Text>Large</Text></Button>
          <Button size="icon"><Icon as={Heart} className="text-primary-foreground" size={16} /></Button>
        </View>
        <Button isLoading loadingText="Saving..."><Text>Save</Text></Button>
        <Button disabled><Text>Disabled</Text></Button>
      </Section>

      {/* Icons */}
      <Section title="Icons">
        <View className="flex-row gap-4 items-center">
          <Icon as={Heart} className="text-destructive" size={20} />
          <Icon as={Star} className="text-warning" size={20} />
          <Icon as={Check} className="text-success" size={20} />
          <Icon as={Bell} className="text-info" size={20} />
          <Icon as={ArrowRight} className="text-primary" size={20} />
          <Icon as={Settings} className="text-muted-foreground" size={20} />
        </View>
      </Section>

      {/* Alerts */}
      <Section title="Alerts">
        <Alert variant="default" title="Heads up" description="This is a default alert." />
        <Alert variant="success" title="Saved!" description="Your changes were saved successfully." />
        <Alert variant="warning" title="Warning" description="This action is irreversible." />
        <Alert variant="destructive" title="Error" description="Something went wrong." />
        <Alert variant="info" title="Info" description="A new version is available." />
      </Section>

      {/* Avatar */}
      <Section title="Avatars">
        <View className="flex-row gap-4 items-center">
          <Avatar alt="User">
            <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=1' }}  />
            <AvatarFallback><Text>JD</Text></AvatarFallback>
          </Avatar>
          <Avatar alt="User">
            <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=2' }} />
            <AvatarFallback><Text>AB</Text></AvatarFallback>
          </Avatar>
          <Avatar alt="User">
            <AvatarFallback><Text>SM</Text></AvatarFallback>
          </Avatar>
        </View>
      </Section>

      {/* Badge */}
      <Section title="Badges">
        <View className="flex-row gap-2">
          <Badge><Text>Default</Text></Badge>
          <Badge className="bg-primary"><Text className="text-primary-foreground">Primary</Text></Badge>
          <Badge className="bg-destructive"><Text className="text-destructive-foreground">Error</Text></Badge>
          <Badge className="bg-success"><Text className="text-success-foreground">Success</Text></Badge>
        </View>
      </Section>

      {/* Card (compound) */}
      <Section title="Card (Compound)">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text>This is the card content area. You can put any content here.</Text>
          </CardContent>
          <CardFooter>
            <Button size="sm"><Text>Action</Text></Button>
          </CardFooter>
        </Card>
      </Section>

      {/* BannerCard */}
      <Section title="Banner Card">
        <BannerCard message="Your trial expires in 3 days" onClose={() => {}} />
        <BannerCard icon={AlertCircle} message="Action required: verify your email" onPress={() => {}} />
        <BannerCard message='' isLoading />
      </Section>

      {/* BasicCard */}
      <Section title="Basic Card">
        <BasicCard title="Getting Started" description="Learn the basics of the platform">
          <Text variant="muted">Card content goes here.</Text>
        </BasicCard>
        <BasicCard
          title="With Footer"
          footer={<Button size="sm"><Text>Go</Text></Button>}
        />
        <BasicCard isLoading title="" />
      </Section>

      {/* SettingsRowCard */}
      <Section title="Settings Row Card">
        <SettingsRowCard icon={Bell} label="Notifications" description="Manage alerts" onPress={() => {}} />
        <SettingsRowCard icon={Settings} label="Preferences" onPress={() => {}} />
        <SettingsRowCard icon={User} label="Account" description="Profile & security" onPress={() => {}} />
        <SettingsRowCard isLoading label="" />
      </Section>

      {/* StatCard */}
      <Section title="Stat Card">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCard label="Revenue" value="$12,450" trendValue="+8.2%" trendDirection="up" />
          </View>
          <View className="flex-1">
            <StatCard label="Errors" value={23} trendValue="-3%" trendDirection="down" />
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
            { icon: Mail, onPress: () => {} },
            { icon: Phone, onPress: () => {} },
          ]}
        />
        <ProfileCard isLoading initials="" name="" />
      </Section>

      {/* ListItemCard */}
      <Section title="List Item Card">
        <ListItemCard title="Order #1234" subtitle="Shipped" meta="2h ago" badge="NEW" />
        <ListItemCard title="Order #1235" subtitle="Processing" statusColor="bg-warning" meta="5h ago" />
        <ListItemCard title="Order #1236" subtitle="Cancelled" statusColor="bg-destructive" />
        <ListItemCard isLoading title="" />
      </Section>

      {/* ActionCard */}
      <Section title="Action Card">
        <ActionCard
          icon={Upload}
          title="Upload Documents"
          description="Drag and drop or click to upload"
          actionLabel="Choose Files"
          onAction={() => {}}
        />
        <ActionCard isLoading title="" actionLabel="" />
      </Section>

      {/* TextField */}
      <Section title="Text Field">
        <TextField label="Email" placeholder="you@example.com" hint="We'll never share your email" />
        <TextField label="Password" placeholder="Enter password" secureTextEntry />
        <TextField label="With Error" placeholder="Required" error="This field is required" />
      </Section>

      {/* TextArea */}
      <Section title="Text Area">
        <TextArea label="Bio" placeholder="Tell us about yourself..." hint="Max 500 characters" />
        <TextArea label="Notes" placeholder="Add notes..." error="Notes cannot be empty" />
      </Section>

      {/* Input (raw) */}
      <Section title="Input (Raw)">
        <Input placeholder="Basic input..." />
      </Section>

      {/* Checkbox */}
      <Section title="Checkbox">
        <Checkbox checked={checkboxVal} onCheckedChange={setCheckboxVal} label="Accept terms and conditions" description="You agree to our terms of service" />
        <Checkbox checked={false} onCheckedChange={() => {}} label="With error" error="You must accept" />
        <Checkbox onCheckedChange={()=>{}} checked disabled label="Disabled checked" />
      </Section>

      {/* Switch */}
      <Section title="Switch">
        <Switch checked={switchVal} onCheckedChange={setSwitchVal} label="Dark mode" />
        <Switch checked={false} onCheckedChange={() => {}} label="With error" error="Must be enabled" />
        <Switch checked onCheckedChange={()=>{}} disabled label="Disabled" />
      </Section>

      {/* RadioGroup */}
      <Section title="Radio Group">
        <RadioGroup value={radioVal} onValueChange={setRadioVal} label="Select a plan">
          <RadioGroupItem value="free" label="Free" onPress={() => setRadioVal('free')} />
          <RadioGroupItem value="pro" label="Pro" onPress={() => setRadioVal('pro')} />
          <RadioGroupItem value="enterprise" label="Enterprise" onPress={() => setRadioVal('enterprise')} />
        </RadioGroup>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <Progress value={progressVal} />
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
        <SectionHeader title="Recent Activity" actionLabel="See All" onAction={() => {}} />
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

export default function App() {
  return (
    <ThemeProvider>
      <DemoContent />
    </ThemeProvider>
  );
}
