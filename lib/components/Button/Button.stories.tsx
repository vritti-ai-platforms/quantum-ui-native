import type { Meta, StoryObj } from '@storybook/react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Button } from './Button';
import { Text } from '../Typography';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

type ButtonStoryArgs = React.ComponentProps<typeof Button> & {
  label: string;
};

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    label: 'Continue',
    variant: 'default',
    size: 'default',
    disabled: false,
    isLoading: false,
    loadingText: 'Saving...',
  },
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    loadingText: { control: 'text' },
    onPress: { action: 'pressed' },
  },
  render: ({ label, ...args }) => (
    <Button {...args}>
      <Text>{label}</Text>
    </Button>
  ),
} satisfies Meta<ButtonStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Variants: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Visual Variants">
        <StoryRow>
          <Button variant="default">
            <Text>Default</Text>
          </Button>
          <Button variant="secondary">
            <Text>Secondary</Text>
          </Button>
          <Button variant="outline">
            <Text>Outline</Text>
          </Button>
          <Button variant="ghost">
            <Text>Ghost</Text>
          </Button>
          <Button variant="destructive">
            <Text>Delete</Text>
          </Button>
          <Button variant="link">
            <Text>Link</Text>
          </Button>
        </StoryRow>
      </StorySection>
      <StorySection title="Sizes And States">
        <StoryRow>
          <Button size="sm">
            <Text>Small</Text>
          </Button>
          <Button size="default">
            <Text>Default</Text>
          </Button>
          <Button size="lg">
            <Text>Large</Text>
          </Button>
          <Button size="icon" variant="outline">
            <MaterialIcons name="favorite" size={16} />
          </Button>
        </StoryRow>
        <StoryRow>
          <Button isLoading loadingText="Saving...">
            <Text>Save</Text>
          </Button>
          <Button disabled>
            <Text>Disabled</Text>
          </Button>
          <Button endAdornment={<MaterialIcons name="arrow-forward" size={16} />}>
            <Text>Continue</Text>
          </Button>
        </StoryRow>
      </StorySection>
    </StoryStack>
  ),
};
