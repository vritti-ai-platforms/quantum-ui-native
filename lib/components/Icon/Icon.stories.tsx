import type { Meta, StoryObj } from '@storybook/react-native';
import { Icon } from './Icon';
import { COMMON_ICONS } from '../DynamicIcon';
import { StoryRow, StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    icon: COMMON_ICONS.info,
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
          <Icon icon={COMMON_ICONS.info} size={20} />
          <Icon icon={COMMON_ICONS.alertSuccess} size={20} />
          <Icon icon={COMMON_ICONS.alertWarning} size={20} />
          <Icon icon={COMMON_ICONS.alertError} size={20} />
          <Icon icon={COMMON_ICONS.chevronLeft} size={20} />
          <Icon icon={COMMON_ICONS.chevronRight} size={20} />
          <Icon icon={COMMON_ICONS.chevronDown} size={20} />
          <Icon icon={COMMON_ICONS.arrowForward} size={20} />
        </StoryRow>
      </StorySection>

      <StorySection title="Sizes">
        <StoryRow>
          <Icon icon={COMMON_ICONS.info} size={12} />
          <Icon icon={COMMON_ICONS.info} size={16} />
          <Icon icon={COMMON_ICONS.info} size={20} />
          <Icon icon={COMMON_ICONS.info} size={24} />
          <Icon icon={COMMON_ICONS.info} size={32} />
          <Icon icon={COMMON_ICONS.info} size={40} />
        </StoryRow>
      </StorySection>

      <StorySection title="Colors via className">
        <StoryRow>
          <Icon icon={COMMON_ICONS.info} size={22} className="text-foreground" />
          <Icon icon={COMMON_ICONS.info} size={22} className="text-primary" />
          <Icon icon={COMMON_ICONS.info} size={22} className="text-destructive" />
          <Icon icon={COMMON_ICONS.info} size={22} className="text-muted-foreground" />
          <Icon icon={COMMON_ICONS.alertWarning} size={22} className="text-warning" />
          <Icon icon={COMMON_ICONS.alertSuccess} size={22} className="text-success" />
        </StoryRow>
      </StorySection>
    </StoryStack>
  ),
};
