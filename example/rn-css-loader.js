/**
 * Custom rspack/webpack loader that compiles CSS → react-native-css StyleCollection.inject() calls.
 *
 * Replaces the Metro transformer from react-native-css/metro.
 * Input: CSS string (already processed by postcss-loader + @tailwindcss/postcss)
 * Output: JS module that injects compiled styles into StyleCollection
 */
module.exports = function rnCssLoader(source) {
  const { compile } = require('react-native-css/compiler');

  const options = this.getOptions() || {};
  const filename = this.resourcePath;
  const projectRoot = options.projectRoot || process.cwd();

  const result = compile(source, {
    filename,
    projectRoot,
    ...options.compilerOptions,
  });

  const stylesheet = result.stylesheet();

  // Resolve the absolute path to react-native-css/native-internal so rspack can find it
  // (subpath exports from hoisted monorepo packages aren't always resolved correctly)
  const nativeInternalPath = require.resolve('react-native-css/native-internal');

  return [
    `import { StyleCollection } from ${JSON.stringify(nativeInternalPath)};`,
    `StyleCollection.inject(${JSON.stringify(stylesheet)});`,
    'export {};',
  ].join('\n');
};
