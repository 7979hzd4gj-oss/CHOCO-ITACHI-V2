export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'temp/**', 'session/**', 'data/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        global: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        structuredClone: 'readonly',
      }
    },
    rules: {
      // CHOCO: on laisse tranquille
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '.*'
      }],

      'no-undef': 'off', // CHOCO FIX pour global.botname etc
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      
      // Les vrais bugs seulement
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-debugger': 'warn',
      
      // CHOCO: on désactive tout ce qui fait chier
      'eqeqeq': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'no-useless-escape': 'off',
      'prefer-template': 'off',
      'object-shorthand': 'off',
      'prefer-arrow-callback': 'off',
      'guard-for-in': 'off',
      'consistent-return': 'off',
      'no-await-in-loop': 'off',
    }
  }
];