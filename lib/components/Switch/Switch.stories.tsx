import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { Switch } from './Switch';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: {
    label: 'Enable notifications',
    checked: true,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (args) => {
    const [checked, setChecked] = useState(Boolean(args.checked));

    return <Switch {...args} checked={checked} onCheckedChange={setChecked} />;
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    checked: true,
    onCheckedChange: () => {},
  },
};

export const States: Story = {
  args: {
    checked: true,
    onCheckedChange: () => {},
  },
  render: () => (
    <StoryStack>
      <Switch label="Enable notifications" checked onCheckedChange={() => {}} />
      <Switch label="Require MFA" checked={false} error="Security policies require this to be enabled." onCheckedChange={() => {}} />
      <Switch label="Locked by policy" checked disabled onCheckedChange={() => {}} />
    </StoryStack>
  ),
};
