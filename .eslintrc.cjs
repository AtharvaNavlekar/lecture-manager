module.exports = {
    root: true,
    env: { node: true, es2021: true },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        // Console statements
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

        // Code quality
        'no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'prefer-const': 'error',
        'no-var': 'error',

        // Complexity
        'complexity': ['warn', 20],
        'max-depth': ['warn', 4],
        'max-lines-per-function': ['warn', {
            max: 200,
            skipBlankLines: true,
            skipComments: true
        }],

        // Best practices
        'eqeqeq': ['error', 'always', { null: 'ignore' }],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-return-await': 'error',
        'require-await': 'warn',
        'no-throw-literal': 'error'
    }
};
