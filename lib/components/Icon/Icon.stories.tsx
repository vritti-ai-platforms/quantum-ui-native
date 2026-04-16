import type { Meta, StoryObj } from '@storybook/react-native';
import { ArrowRight, Bell, Heart, Home, Search, Settings, Star, User } from 'lucide-react-native';
import { Icon } from './Icon';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    as: Star,
    size: 20,
    className: 'text-foreground',
  },
  argTypes: {
    size: { control: { type: 'number', min: 10, max: 64, step: 2 } },
    className: { control: 'text' },
  },
  render: (args) => <Icon {...args} />,
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Showcase: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Common Icons">
        <StoryRow>
          <Icon as={Home} size={20} />
          <Icon as={Search} size={20} />
          <Icon as={Bell} size={20} />
          <Icon as={Heart} size={20} />
          <Icon as={User} size={20} />
          <Icon as={Settings} size={20} />
          <Icon as={Star} size={20} />
          <Icon as={ArrowRight} size={20} />
        </StoryRow>
      </StorySection>

      <StorySection title="Sizes">
        <StoryRow>
          <Icon as={Star} size={12} />
          <Icon as={Star} size={16} />
          <Icon as={Star} size={20} />
          <Icon as={Star} size={24} />
          <Icon as={Star} size={32} />
          <Icon as={Star} size={40} />
        </StoryRow>
      </StorySection>

      <StorySection title="Colors via className">
        <StoryRow>
          <Icon as={Heart} size={22} className="text-foreground" />
          <Icon as={Heart} size={22} className="text-primary" />
          <Icon as={Heart} size={22} className="text-destructive" />
          <Icon as={Heart} size={22} className="text-muted-foreground" />
          <Icon as={Bell} size={22} className="text-warning" />
          <Icon as={Bell} size={22} className="text-success" />
        </StoryRow>
      </StorySection>
    </StoryStack>
  ),
};
