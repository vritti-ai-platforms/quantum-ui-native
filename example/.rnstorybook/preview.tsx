import type { Decorator, Preview } from '@storybook/react-native';
import { View } from 'react-native';
import { ThemeProvider } from '../../lib/theme';

const withThemeProvider: Decorator = (Story) => (
  <ThemeProvider defaultScheme="light">
    <View className="flex-1 bg-background p-4 justify-center">
      <Story />
    </View>
  </ThemeProvider>
);

const preview: Preview = {
  decorators: [withThemeProvider],
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
