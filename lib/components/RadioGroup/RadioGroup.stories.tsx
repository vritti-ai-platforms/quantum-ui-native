import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './RadioGroup';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: {
    label: 'Choose a plan',
    value: 'starter',
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
  },
  render: (args) => {
    const [value, setValue] = useState(String(args.value ?? 'starter'));

    return (
      <RadioGroup {...args} value={value} onValueChange={setValue}>
        <RadioGroupItem value="starter" label="Starter" onPress={() => setValue('starter')} />
        <RadioGroupItem value="growth" label="Growth" onPress={() => setValue('growth')} />
        <RadioGroupItem value="enterprise" label="Enterprise" onPress={() => setValue('enterprise')} />
      </RadioGroup>
    );
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: 'starter',
    onValueChange: () => {},
  },
};

export const WithError: Story = {
  args: {
    value: '',
    onValueChange: () => {},
  },
  render: () => (
    <StoryStack>
      <RadioGroup
        label="Choose a plan"
        error="Please select one option."
        value=""
        onValueChange={() => {}}
      >
        <RadioGroupItem value="starter" label="Starter" onPress={() => {}} />
        <RadioGroupItem value="growth" label="Growth" onPress={() => {}} />
      </RadioGroup>
    </StoryStack>
  ),
};
