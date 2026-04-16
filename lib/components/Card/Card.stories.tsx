import type { Meta, StoryObj } from '@storybook/react-native';
import { CreditCard, ShieldCheck, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '../Button';
import { Text } from '../Typography';
import { ActionCard, BannerCard, BasicCard, StatCard } from './index';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Card',
  component: BasicCard,
  tags: ['autodocs'],
  argTypes: {
    onPress: { action: 'pressed' },
  },
  args: {
    title: 'Workspace access',
    description: 'Invite teammates and manage their permissions from one place.',
  },
} satisfies Meta<typeof BasicCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {},
  render: (args) => (
    <BasicCard
      {...args}
      footer={
        <Button variant="outline" size="sm">
          <Text>Review</Text>
        </Button>
      }
    >
      <Text className="text-sm text-muted-foreground">
        Keep members aligned with clear ownership, approval steps, and access policies.
      </Text>
    </BasicCard>
  ),
};

export const Showcase: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Highlights">
        <BannerCard
          icon={Sparkles}
          message="You have 3 onboarding tasks waiting."
          onClose={() => {}}
        />
        <ActionCard
          icon={ShieldCheck}
          title="Upgrade workspace security"
          description="Turn on device posture checks and session controls for privileged access."
          actionLabel="Review settings"
          onAction={() => {}}
        />
      </StorySection>
      <StorySection title="Metrics">
        <StoryRow>
          <View className="flex-1 min-w-[140px]">
            <StatCard label="Active users" value="2,481" trendValue="+12.4%" trendDirection="up" />
          </View>
          <View className="flex-1 min-w-[140px]">
            <StatCard label="Failed payments" value="18" trendValue="-4.1%" trendDirection="down" />
          </View>
        </StoryRow>
      </StorySection>
      <StorySection title="Focused Flow">
        <BasicCard
          title="Payment method"
          description="Add a backup payment card for uninterrupted service."
          footer={
            <Button size="sm">
              <Text>Save card</Text>
            </Button>
          }
        >
          <StoryStack className="gap-2">
            <Text className="text-sm text-muted-foreground">Primary card ending in 4482</Text>
            <StoryRow>
              <CreditCard size={16} />
              <Text className="text-sm">Visa Business</Text>
            </StoryRow>
          </StoryStack>
        </BasicCard>
      </StorySection>
    </StoryStack>
  ),
};
