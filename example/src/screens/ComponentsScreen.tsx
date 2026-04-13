import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Alert } from '@vritti/quantum-ui-native/Alert';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@vritti/quantum-ui-native/Avatar';
import { Badge } from '@vritti/quantum-ui-native/Badge';
import { Icon } from '@vritti/quantum-ui-native/Icon';
import { useTheme } from '@vritti/quantum-ui-native/hooks';
import {
  Heart,
  Star,
  Check,
  Bell,
  ArrowRight,
  Settings,
  Moon,
  Sun,
} from 'lucide-react-native';
import { Section } from '../components/Section';

export default function ComponentsScreen() {
  const { isDark, toggleColorScheme } = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-5 pb-6 gap-6"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text variant="h2" className="text-foreground">
          Elements
        </Text>
        <Button variant="outline" size="icon" onPress={toggleColorScheme}>
          <Icon
            as={isDark ? Sun : Moon}
            className="text-foreground"
            size={18}
          />
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
          <Button variant="default">
            <Text>Default</Text>
          </Button>
          <Button variant="destructive">
            <Text>Destructive</Text>
          </Button>
          <Button variant="outline">
            <Text>Outline</Text>
          </Button>
          <Button variant="secondary">
            <Text>Secondary</Text>
          </Button>
          <Button variant="ghost">
            <Text>Ghost</Text>
          </Button>
          <Button variant="link">
            <Text>Link</Text>
          </Button>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Button size="sm">
            <Text>Small</Text>
          </Button>
          <Button size="default">
            <Text>Default</Text>
          </Button>
          <Button size="lg">
            <Text>Large</Text>
          </Button>
          <Button size="icon">
            <Icon as={Heart} className="text-primary-foreground" size={16} />
          </Button>
        </View>
        <Button isLoading loadingText="Saving...">
          <Text>Save</Text>
        </Button>
        <Button disabled>
          <Text>Disabled</Text>
        </Button>
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
        <Alert
          variant="default"
          title="Heads up"
          description="This is a default alert."
        />
        <Alert
          variant="success"
          title="Saved!"
          description="Your changes were saved successfully."
        />
        <Alert
          variant="warning"
          title="Warning"
          description="This action is irreversible."
        />
        <Alert
          variant="destructive"
          title="Error"
          description="Something went wrong."
        />
        <Alert
          variant="info"
          title="Info"
          description="A new version is available."
        />
      </Section>

      {/* Avatars */}
      <Section title="Avatars">
        <View className="flex-row gap-4 items-center">
          <Avatar alt="User">
            <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=1' }} />
            <AvatarFallback>
              <Text>JD</Text>
            </AvatarFallback>
          </Avatar>
          <Avatar alt="User">
            <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=2' }} />
            <AvatarFallback>
              <Text>AB</Text>
            </AvatarFallback>
          </Avatar>
          <Avatar alt="User">
            <AvatarFallback>
              <Text>SM</Text>
            </AvatarFallback>
          </Avatar>
        </View>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <View className="flex-row gap-2">
          <Badge>
            <Text>Default</Text>
          </Badge>
          <Badge className="bg-primary">
            <Text className="text-primary-foreground">Primary</Text>
          </Badge>
          <Badge className="bg-destructive">
            <Text className="text-destructive-foreground">Error</Text>
          </Badge>
          <Badge className="bg-success">
            <Text className="text-success-foreground">Success</Text>
          </Badge>
        </View>
      </Section>
    </ScrollView>
  );
}
