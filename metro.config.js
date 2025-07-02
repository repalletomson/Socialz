// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require("nativewind/metro");

// /** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
// config.resolver.assetExts.push("cjs")
// config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx'];

module.exports = withNativeWind(config, { input: "./global.css" });

