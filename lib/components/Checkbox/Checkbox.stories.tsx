import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { Checkbox } from './Checkbox';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    label: 'Accept terms and conditions',
    description: 'You agree to the updated billing and privacy terms.',
    checked: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (args) => {
    const [checked, setChecked] = useState(Boolean(args.checked));

    return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />;
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    checked: false,
    onCheckedChange: () => {},
  },
};

export const States: Story = {
  args: {
    checked: false,
    onCheckedChange: () => {},
  },
  render: () => (
    <StoryStack>
      <Checkbox
        label="Accept terms and conditions"
        description="You agree to the updated billing and privacy terms."
        checked
        onCheckedChange={() => {}}
      />
      <Checkbox
        label="Require admin approval"
        error="This permission requires at least one owner."
        checked={false}
        onCheckedChange={() => {}}
      />
      <Checkbox label="Read only mode" checked disabled onCheckedChange={() => {}} />
    </StoryStack>
  ),
};
