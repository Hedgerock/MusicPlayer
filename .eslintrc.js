const sourceExtensionRestriction = {
  group: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  message: 'Omit source file extensions from import paths.',
};

module.exports = {
  root: true,
  extends: '@react-native',

  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [sourceExtensionRestriction],
      },
    ],
  },

  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'separate-type-imports',
          },
        ],

        'no-restricted-syntax': [
          'error',
          {
            selector: 'ImportSpecifier[importKind="type"]',
            message: 'Use a separate import type declaration.',
          },
          {
            selector: 'Program > EmptyStatement',
            message: 'Remove the unnecessary standalone semicolon.',
          },
        ],
      },
    },

    {
      files: ['src/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              sourceExtensionRestriction,
              {
                group: ['.', '..', './**', '../**'],
                message: 'Use the @/ alias for imports within src.',
              },
            ],
          },
        ],
      },
    },
  ],
};
