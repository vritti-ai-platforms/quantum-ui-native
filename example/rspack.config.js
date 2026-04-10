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
const rnCssAliases = {
  'react-native-css/native-internal': path.join(rnCssRoot, 'dist/commonjs/native-internal/index.js'),
  'react-native-css/utilities': path.join(rnCssRoot, 'dist/commonjs/utilities/index.js'),
  'react-native-css/compiler': path.join(rnCssRoot, 'dist/commonjs/compiler/index.js'),
  'react-native-css/native': path.join(rnCssRoot, 'dist/commonjs/native/index.js'),
};

const rnCssComponentsPath = path.join(rnCssRoot, 'dist/commonjs/components/index.cjs');
const rnCssSafeAreaPath = path.join(rnCssRoot, 'dist/commonjs/components/react-native-safe-area-context.js');

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
module.exports = (env) => {
  const { platform, mode } = env;
  const isNative = platform !== 'web';

  return {
    mode,
    context: __dirname,
    entry: './index.js',

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
        ...rnCssAliases,
        'react-native-css/components': path.join(rnCssRoot, 'dist/commonjs/components'),
        'colorjs.io/fn': require.resolve('colorjs.io/fn'),
        // React Navigation v8 subpath exports (Rspack doesn't resolve them automatically)
        '@react-navigation/elements/internal': path.join(
          path.dirname(require.resolve('@react-navigation/elements/package.json')),
          'lib/module/internal.js'
        ),
      },
    },

    output: {
      uniqueName: 'quantum-ui-native-example',
    },

    module: {
      rules: [
        // lucide-react-native: skip hermes-parser (it rejects `const Infinity` shadowing global)
        {
          test: /\.[cm]?[jt]sx?$/,
          include: [/node_modules[\\/]+lucide-react-native/],
          type: 'javascript/auto',
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'ecmascript', jsx: true },
                transform: { react: { runtime: 'automatic' } },
              },
            },
          },
        },

        // Everything else: babel-swc-loader (RN 0.81+ compatible)
        {
          test: /\.[cm]?[jt]sx?$/,
          exclude: [/node_modules[\\/]+lucide-react-native/],
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
          ? [{
              test: /\.css$/,
              use: [
                { loader: path.resolve(__dirname, 'rn-css-loader.js'), options: { projectRoot: __dirname } },
                { loader: 'postcss-loader', options: { postcssOptions: { plugins: { '@tailwindcss/postcss': {} } } } },
              ],
            }]
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
          ]
        : []),
    ],
  };
};
