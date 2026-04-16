import type { Meta, StoryObj } from '@storybook/react-native';
import { TextField } from './TextField';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    hint: 'We will only use this for account updates.',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    secureTextEntry: { control: 'boolean' },
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const CommonStates: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <TextField label="Email address" placeholder="you@example.com" hint="We will only use this for account updates." />
      <TextField label="Password" placeholder="Enter password" secureTextEntry />
      <TextField label="Workspace name" placeholder="Required" error="Workspace name is required." />
    </StoryStack>
  ),
};
