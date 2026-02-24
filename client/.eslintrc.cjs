module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
    ],
    settings: {
        react: { version: 'detect' }
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        // Strict: No console in frontend
        'no-console': 'error',
        'no-debugger': 'error',

        // React specific
        'react/prop-types': 'off', // Not using PropTypes
        'react/react-in-jsx-scope': 'off', // React 17+
        'react/jsx-uses-react': 'off', // React 17+

        // Hooks
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // Code quality
        'no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true
        }],
        'prefer-const': 'error',
        'no-var': 'error',

        // Best practices
        'eqeqeq': ['error', 'always', { null: 'ignore' }],
        'no-eval': 'error'
    }
};
