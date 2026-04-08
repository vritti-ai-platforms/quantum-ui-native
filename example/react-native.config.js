const path = require('path');
const pkg = require('../package.json');

module.exports = {
  commands: require('@callstack/repack/commands/rspack'),
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
