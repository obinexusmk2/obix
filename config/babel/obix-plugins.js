/**
 * OBIX Babel Plugin Configuration
 * 
 * This file configures the OBIX-specific Babel plugins that integrate
 * with the DOP adapter pattern and validation functionality.
 */

module.exports = function(api) {
  api.cache(true);
  
  // OBIX-specific plugins
  const obixPlugins = [
    require('../../plugins/babel-plugin-obix-component-syntax'),
    require('../../plugins/babel-plugin-obix-state-optimization')
  ];
  
  // Feature flags for optional OBIX transformations
  const optionalPlugins = [];
  
  if (process.env.OBIX_ENABLE_VALIDATION) {
    optionalPlugins.push(require('../../plugins/babel-plugin-obix-validation'));
  }
  
  return {
    plugins: [...obixPlugins, ...optionalPlugins]
  };
};
