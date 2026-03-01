export default function(api) {
  api.cache(true);

  const presets = [
    ["@babel/preset-env", {
      "targets": {
        "node": "14",
        "browsers": [
          "last 2 Chrome versions",
          "last 2 Firefox versions",
          "last 2 Safari versions",
          "last 2 Edge versions"
        ]
      },
      "modules": false,
      "useBuiltIns": "usage",
      "corejs": 3
    }],
    "@babel/preset-typescript"
  ];

  const plugins = [
    "babel-plugin-transform-typescript-metadata",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    "@babel/plugin-transform-runtime"
  ];

  // Load OBIX-specific plugins
  let obixPlugins = [];
  try {
    const obixPluginConfig = require('./config/babel/obix-plugins')(api);
    obixPlugins = obixPluginConfig.plugins || [];
  } catch (e) {
    console.warn('OBIX plugins not loaded:', e.message);
  }

  // Environment-based features
  if (process.env.OBIX_ENABLE_JSX) {
    plugins.push("@babel/plugin-syntax-jsx");
  }

  return {
    presets,
    plugins: [...plugins, ...obixPlugins],
    sourceMaps: true,
    ignore: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/node_modules/**"
    ]
  };
}