const path = require('path');
const rspack = require('@rspack/core');
const Repack = require('@callstack/repack');
const { ReanimatedPlugin } = require('@callstack/repack-plugin-reanimated');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');

// Resolve react-native-css subpath exports to absolute paths
// (subpath exports from hoisted monorepo packages aren't always resolved by rspack)
const rnCssRoot = path.dirname(
  require.resolve('react-native-css/package.json')
);
const storybookRoot = path.dirname(require.resolve('storybook/package.json'));
const rnCssAliases = {
  'react-native-css/native-internal': path.join(
    rnCssRoot,
    'dist/commonjs/native-internal/index.js'
  ),
  'react-native-css/utilities': path.join(
    rnCssRoot,
    'dist/commonjs/utilities/index.js'
  ),
  'react-native-css/compiler': path.join(
    rnCssRoot,
    'dist/commonjs/compiler/index.js'
  ),
  'react-native-css/native': path.join(
    rnCssRoot,
    'dist/commonjs/native/index.js'
  ),
};
const storybookAliases = {
  '@react-native-community/slider': path.resolve(
    __dirname,
    'src/storybook/StorybookSliderFallback.tsx'
  ),
  'storybook/actions': path.join(storybookRoot, 'dist/actions/index.js'),
  'storybook/global': require.resolve('@storybook/global'),
  'storybook/internal/channels': path.join(
    storybookRoot,
    'dist/channels/index.js'
  ),
  'storybook/internal/client-logger': path.join(
    storybookRoot,
    'dist/client-logger/index.js'
  ),
  'storybook/internal/common': path.join(storybookRoot, 'dist/common/index.js'),
  'storybook/internal/core-events': path.join(
    storybookRoot,
    'dist/core-events/index.js'
  ),
  'storybook/internal/csf': path.join(storybookRoot, 'dist/csf/index.js'),
  'storybook/internal/docs-tools': path.join(
    storybookRoot,
    'dist/docs-tools/index.js'
  ),
  'storybook/internal/instrumenter': path.join(
    storybookRoot,
    'dist/instrumenter/index.js'
  ),
  'storybook/internal/manager-api': path.join(
    storybookRoot,
    'dist/manager-api/index.js'
  ),
  'storybook/internal/preview-errors': path.join(
    storybookRoot,
    'dist/preview-errors.js'
  ),
  'storybook/internal/preview-api': path.join(
    storybookRoot,
    'dist/preview-api/index.js'
  ),
  'storybook/internal/router': path.join(storybookRoot, 'dist/router/index.js'),
  'storybook/internal/types': path.join(storybookRoot, 'dist/types/index.js'),
  'storybook/preview-api': path.join(
    storybookRoot,
    'dist/preview-api/index.js'
  ),
  'storybook/test': path.join(storybookRoot, 'dist/test/index.js'),
  'storybook/theming/create': path.join(
    storybookRoot,
    'dist/theming/create.js'
  ),
};

const rnCssComponentsPath = path.join(
  rnCssRoot,
  'dist/commonjs/components/index.cjs'
);

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
module.exports = (env) => {
  const { platform, mode } = env;
  const isNative = platform !== 'web';

  return {
    mode,
    context: __dirname,
    entry: './index.js',
    devtool: mode === 'development' ? 'cheap-module-source-map' : false,

    resolve: {
      ...Repack.getResolveOptions(platform),
      conditionNames: ['react-native', 'require', 'import', 'node', 'default'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(root, 'node_modules'),
        'node_modules',
      ],
      alias: {
        [pak.name]: path.resolve(root, 'lib', 'index.tsx'),
        [`${pak.name}/Alert`]: path.resolve(
          root,
          'lib/components/Alert/index.ts'
        ),
        [`${pak.name}/Avatar`]: path.resolve(
          root,
          'lib/components/Avatar/index.ts'
        ),
        [`${pak.name}/Badge`]: path.resolve(
          root,
          'lib/components/Badge/index.ts'
        ),
        [`${pak.name}/BottomSheet`]: path.resolve(
          root,
          'lib/components/BottomSheet/index.ts'
        ),
        [`${pak.name}/BottomNavigation`]: path.resolve(
          root,
          'lib/components/BottomNavigation/index.ts'
        ),
        [`${pak.name}/Button`]: path.resolve(
          root,
          'lib/components/Button/index.ts'
        ),
        [`${pak.name}/Card`]: path.resolve(
          root,
          'lib/components/Card/index.ts'
        ),
        [`${pak.name}/Checkbox`]: path.resolve(
          root,
          'lib/components/Checkbox/index.ts'
        ),
        [`${pak.name}/DynamicIcon`]: path.resolve(
          root,
          'lib/components/DynamicIcon/index.ts'
        ),
        [`${pak.name}/FlashList`]: path.resolve(
          root,
          'lib/components/FlashList/index.ts'
        ),
        [`${pak.name}/Form`]: path.resolve(
          root,
          'lib/components/Form/index.ts'
        ),
        [`${pak.name}/Input`]: path.resolve(
          root,
          'lib/components/Input/index.ts'
        ),
        [`${pak.name}/Icon`]: path.resolve(
          root,
          'lib/components/Icon/index.ts'
        ),
        [`${pak.name}/Label`]: path.resolve(
          root,
          'lib/components/Label/index.ts'
        ),
        [`${pak.name}/NativeStack`]: path.resolve(
          root,
          'lib/components/NativeStack/index.ts'
        ),
        [`${pak.name}/Progress`]: path.resolve(
          root,
          'lib/components/Progress/index.ts'
        ),
        [`${pak.name}/RadioGroup`]: path.resolve(
          root,
          'lib/components/RadioGroup/index.ts'
        ),
        [`${pak.name}/Separator`]: path.resolve(
          root,
          'lib/components/Separator/index.ts'
        ),
        [`${pak.name}/Skeleton`]: path.resolve(
          root,
          'lib/components/Skeleton/index.ts'
        ),
        [`${pak.name}/Spinner`]: path.resolve(
          root,
          'lib/components/Spinner/index.ts'
        ),
        [`${pak.name}/Switch`]: path.resolve(
          root,
          'lib/components/Switch/index.ts'
        ),
        [`${pak.name}/TextArea`]: path.resolve(
          root,
          'lib/components/TextArea/index.ts'
        ),
        [`${pak.name}/TextField`]: path.resolve(
          root,
          'lib/components/TextField/index.ts'
        ),
        [`${pak.name}/Typography`]: path.resolve(
          root,
          'lib/components/Typography/index.ts'
        ),
        [`${pak.name}/theme`]: path.resolve(root, 'lib/theme/index.ts'),
        [`${pak.name}/context`]: path.resolve(root, 'lib/context/index.ts'),
        [`${pak.name}/hooks`]: path.resolve(root, 'lib/hooks/index.ts'),
        [`${pak.name}/config`]: path.resolve(root, 'lib/config/index.ts'),
        [`${pak.name}/types`]: path.resolve(root, 'lib/types/index.ts'),
        [`${pak.name}/utils/axios`]: path.resolve(root, 'lib/utils/axios.ts'),
        [`${pak.name}/utils/cn`]: path.resolve(root, 'lib/utils/cn.ts'),
        ...rnCssAliases,
        ...storybookAliases,
        'react-native-css/components': path.join(
          rnCssRoot,
          'dist/commonjs/components'
        ),
        'colorjs.io/fn': require.resolve('colorjs.io/fn'),
        // React Navigation v8 subpath exports (Rspack doesn't resolve them automatically)
        '@react-navigation/elements/internal': path.join(
          path.dirname(
            require.resolve('@react-navigation/elements/package.json')
          ),
          'lib/module/internal.js'
        ),
      },
    },

    output: {
      uniqueName: 'quantum-ui-native-example',
    },

    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          type: 'javascript/auto',
          use: {
            loader: '@callstack/repack/babel-swc-loader',
            parallel: true,
            options: {},
          },
        },

        // Assets
        ...Repack.getAssetTransformRules(),

        // CSS: PostCSS (Tailwind v4) → rn-css-loader (react-native-css compiler)
        ...(isNative
          ? [
              {
                test: /\.css$/,
                use: [
                  {
                    loader: path.resolve(__dirname, 'rn-css-loader.js'),
                    options: { projectRoot: __dirname },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      postcssOptions: {
                        plugins: { '@tailwindcss/postcss': {} },
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },

    plugins: [
      new Repack.RepackPlugin({
        output: { bundleFilename: 'index.bundle' },
      }),
      new ReanimatedPlugin({ unstable_disableTransform: true }),

      // Fix react-native-css/components/* resolution
      // The babel preset rewrites to individual paths like react-native-css/components/View
      // — redirect them to the components index which re-exports everything
      ...(isNative
        ? [
            new rspack.NormalModuleReplacementPlugin(
              /^react-native-css\/components\/.+$/,
              (resource) => {
                resource.request = rnCssComponentsPath;
              }
            ),
            new rspack.NormalModuleReplacementPlugin(
              /^react-native-css\/react-native$/,
              (resource) => {
                resource.request = rnCssComponentsPath;
              }
            ),
            // Stub out the Metro setup check — it throws an error for non-Metro bundlers
            // The babel preset handles the setup; this module is a Metro-only fallback
            new rspack.NormalModuleReplacementPlugin(
              /react-native-css-metro-override/,
              require.resolve('./noop.js')
            ),
            new rspack.NormalModuleReplacementPlugin(
              /^os$/,
              require.resolve('./noop.js')
            ),
            new rspack.NormalModuleReplacementPlugin(
              /^tty$/,
              require.resolve('./noop.js')
            ),
            new rspack.NormalModuleReplacementPlugin(
              /@storybook\/react\/template\/cli/,
              require.resolve('./noop.js')
            ),
          ]
        : []),
    ],
  };
};
