import type { Meta, StoryObj } from '@storybook/react-native';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { Text } from '../Typography';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    className: 'size-12',
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ImageAvatar: Story = {
  args: {
    alt: 'Jane Doe',
  },
  render: (args) => (
    <Avatar {...args} alt="Jane Doe">
      <AvatarImage source={{ uri: 'https://i.pravatar.cc/150?img=32' }} />
      <AvatarFallback>
        <Text>JD</Text>
      </AvatarFallback>
    </Avatar>
  ),
};

export const Fallbacks: Story = {
  args: {
    alt: 'Fallback avatar',
  },
  render: () => (
    <StoryStack>
      <StorySection title="Fallback States">
        <StoryRow>
          <Avatar className="size-12" alt="Jane Doe">
            <AvatarFallback>
              <Text>JD</Text>
            </AvatarFallback>
          </Avatar>
          <Avatar className="size-14" alt="Sam Miller">
            <AvatarFallback>
              <Text>SM</Text>
            </AvatarFallback>
          </Avatar>
          <Avatar className="size-16" alt="Alex Brown">
            <AvatarFallback>
              <Text>AB</Text>
            </AvatarFallback>
          </Avatar>
        </StoryRow>
      </StorySection>
    </StoryStack>
  ),
};
