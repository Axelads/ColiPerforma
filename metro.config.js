// metro.config.js (Expo SDK 53)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Activer le transformer SCSS
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-sass-transformer'),
};

// Autoriser les extensions .scss / .sass
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'scss', 'sass'],
};

module.exports = config;
