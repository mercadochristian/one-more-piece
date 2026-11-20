export default {
  ignoreFiles: [
    'node_modules/**',
    '_site/**',
    'shared/beans-tokens.css',
    'shared/beans-components.css',
  ],
  reportDescriptionlessDisables: true,
  reportNeedlessDisables: true,
  reportInvalidScopeDisables: true,
  rules: {
    'no-duplicate-selectors': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-duplicate-custom-properties': true,
    'declaration-no-important': true,
  },
};
