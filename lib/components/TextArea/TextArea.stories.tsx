import type { Meta, StoryObj } from '@storybook/react-native';
import { TextArea } from './TextArea';
import { StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  args: {
    label: 'Project brief',
    placeholder: 'Summarize the scope and desired outcome...',
    hint: 'Keep it under 500 characters.',
    numberOfLines: 4,
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const ValidationStates: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <TextArea label="Project brief" placeholder="Summarize the scope..." hint="Keep it under 500 characters." numberOfLines={4} />
      <TextArea label="Notes" placeholder="Add internal notes..." error="Notes cannot be empty." numberOfLines={4} />
    </StoryStack>
  ),
};
