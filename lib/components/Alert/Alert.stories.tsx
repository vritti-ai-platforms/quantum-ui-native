import type { Meta, StoryObj } from '@storybook/react-native';
import { Alert } from './Alert';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive', 'info'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    variant: 'default',
    title: 'Heads up',
    description: 'This is a native alert rendered through Storybook.',
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Variants: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <Alert variant="default" title="Heads up" description="Default informational alert." />
      <Alert variant="success" title="Saved" description="Your changes were saved successfully." />
      <Alert variant="warning" title="Warning" description="This action cannot be undone." />
      <Alert variant="destructive" title="Error" description="The request could not be completed." />
      <Alert variant="info" title="Info" description="A newer version is available." />
    </StoryStack>
  ),
};
