import AsyncStorage from '@react-native-async-storage/async-storage';

let StorybookUIRoot: (() => React.JSX.Element) | null = null;

try {
  const { view } = require('./storybook.requires');
  StorybookUIRoot = view.getStorybookUI({
    storage: {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
    },
  });
} catch (error) {
  console.error('[Storybook] Failed to initialize:', error);
}

export default StorybookUIRoot;
