const path = require('node:path');

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      const modulePath = moduleName.startsWith('@/')
        ? path.resolve(__dirname, 'src', moduleName.slice(2))
        : moduleName;

      const resolve =
        defaultConfig.resolver.resolveRequest ?? context.resolveRequest;

      return resolve(context, modulePath, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
