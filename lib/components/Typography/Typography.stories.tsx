import type { Meta, StoryObj } from '@storybook/react-native';
import { Text } from './Typography';
import { StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Typography',
  component: Text,
  tags: ['autodocs'],
  args: {
    variant: 'default',
    children: 'The quick brown fox jumps over the lazy dog.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'h1', 'h2', 'h3', 'h4', 'p', 'lead', 'large', 'small', 'muted', 'code', 'blockquote'],
    },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {},
};

export const Scale: Story = {
  args: {},
  render: () => (
    <StoryStack>
      <StorySection title="Headings">
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="h4">Heading 4</Text>
      </StorySection>
      <StorySection title="Body Copy">
        <Text variant="p">Paragraph text with the default component rhythm and spacing.</Text>
        <Text variant="lead">Lead copy for more prominent explanatory content.</Text>
        <Text variant="large">Large supporting text</Text>
        <Text variant="small">Small utility text</Text>
        <Text variant="muted">Muted helper text</Text>
        <Text variant="code">const workspace = 'quantum';</Text>
        <Text variant="blockquote">Design systems are maintained through repeatable decisions, not one-off screens.</Text>
      </StorySection>
    </StoryStack>
  ),
};
