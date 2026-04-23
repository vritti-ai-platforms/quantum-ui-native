/** @type {import('@storybook/react-native').StorybookConfig} */
const config = {
  stories: ['../../lib/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
    '@storybook/addon-ondevice-backgrounds',
  ],
};

module.exports = config;
