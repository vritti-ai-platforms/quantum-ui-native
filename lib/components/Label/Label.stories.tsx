import type { Meta, StoryObj } from '@storybook/react-native';
import { Chip } from './Chip';
import { CountBadge } from './CountBadge';
import { FormLabel } from './FormLabel';
import { KeyValue } from './KeyValue';
import { SectionHeader } from './SectionHeader';
import { StatusDot } from './StatusDot';
import { TagGroup } from './TagGroup';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Label',
  component: FormLabel,
  tags: ['autodocs'],
  args: {
    label: 'Email address',
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof FormLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Showcase: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="FormLabel">
        <FormLabel label="Email address" />
        <FormLabel label="Password" required />
        <FormLabel label="Phone number" required />
      </StorySection>

      <StorySection title="Chip">
        <StoryRow>
          <Chip label="Design" />
          <Chip label="Engineering" />
          <Chip label="Removable" onRemove={() => {}} />
          <Chip label="Also removable" onRemove={() => {}} />
        </StoryRow>
      </StorySection>

      <StorySection title="CountBadge">
        <StoryRow>
          <CountBadge count={1} />
          <CountBadge count={5} />
          <CountBadge count={12} />
          <CountBadge count={99} />
        </StoryRow>
      </StorySection>

      <StorySection title="KeyValue">
        <StoryRow>
          <KeyValue label="Plan" value="Pro" />
          <KeyValue label="Members" value="12" />
          <KeyValue label="Storage" value="50 GB" />
        </StoryRow>
      </StorySection>

      <StorySection title="SectionHeader">
        <SectionHeader title="Recent Activity" />
        <SectionHeader title="Notifications" actionLabel="Clear all" onAction={() => {}} />
      </StorySection>

      <StorySection title="StatusDot">
        <StoryRow>
          <StatusDot label="Online" color="bg-success" />
          <StatusDot label="Offline" color="bg-muted-foreground" />
          <StatusDot label="Error" color="bg-destructive" />
          <StatusDot label="Pending" color="bg-warning" />
        </StoryRow>
      </StorySection>

      <StorySection title="TagGroup">
        <TagGroup tags={['React Native', 'TypeScript', 'Storybook', 'NativeWind', 'Expo']} />
      </StorySection>
    </StoryStack>
  ),
};
