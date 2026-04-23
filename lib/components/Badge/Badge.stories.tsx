import type { Meta, StoryObj } from '@storybook/react-native';
import { Badge } from './Badge';
import { Text } from '../Typography';
import { StoryRow } from '../../storybook/StoryLayout';

type BadgeStoryArgs = React.ComponentProps<typeof Badge> & {
  label: string;
};

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    label: 'Default',
  },
  argTypes: {
    label: { control: 'text' },
  },
  render: ({ label, ...args }) => (
    <Badge {...args}>
      <Text>{label}</Text>
    </Badge>
  ),
} satisfies Meta<BadgeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const StatusSet: Story = {
  args: {},
  render: () => (
    <StoryRow>
      <Badge>
        <Text>Default</Text>
      </Badge>
      <Badge className="bg-primary">
        <Text className="text-primary-foreground">Primary</Text>
      </Badge>
      <Badge className="bg-success">
        <Text className="text-success-foreground">Success</Text>
      </Badge>
      <Badge className="bg-destructive">
        <Text className="text-destructive-foreground">Error</Text>
      </Badge>
    </StoryRow>
  ),
};
