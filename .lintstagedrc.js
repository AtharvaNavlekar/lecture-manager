module.exports = {
    '*.js': [
        'eslint --fix',
        'prettier --write'
    ],
    '*.jsx': [
        'eslint --fix',
        'prettier --write',
        'node scripts/check-console-statements.js'
    ],
    '*.{json,md,yml,yaml}': [
        'prettier --write'
    ]
};
