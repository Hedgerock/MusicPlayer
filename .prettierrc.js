module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  bracketSpacing: true,
  tabWidth: 2,

  plugins: ['@ianvs/prettier-plugin-sort-imports'],

  importOrder: [
    '^node:',
    '<BUILTIN_MODULES>',
    '<TYPES>^node:',
    '',
    '<THIRD_PARTY_MODULES>',
    '<TYPES>',
    '',
    '^@/',
    '<TYPES>^@/',
    '',
    '^[.]',
    '<TYPES>^[.]',
  ],

  importOrderTypeScriptVersion: '6.0.3',
};
