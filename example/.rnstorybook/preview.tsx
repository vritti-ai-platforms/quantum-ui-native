import type { Decorator, Preview } from '@storybook/react-native';
import { View } from 'react-native';

const withStoryLayout: Decorator = (Story) => (
  <View className="flex-1 bg-background p-4 justify-center">
    <Story />
  </View>
);

const preview: Preview = {
  decorators: [withStoryLayout],
  parameters: {
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },
    backgrounds: {
      default: 'canvas',
      values: [
        { name: 'canvas', value: '#f8fafc' },
        { name: 'surface', value: '#ffffff' },
        { name: 'contrast', value: '#020817' },
      ],
    },
    controls: {
      expanded: true,
    },
  },
};

export default preview;
