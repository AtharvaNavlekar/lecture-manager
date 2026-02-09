module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', [
            'feat',     // New feature
            'fix',      // Bug fix
            'docs',     // Documentation changes
            'style',    // Code style changes (formatting, etc.)
            'refactor', // Code refactoring
            'perf',     // Performance improvements
            'test',     // Adding or updating tests
            'chore',    // Maintenance tasks
            'revert',   // Reverting changes
            'build',    // Build system changes
            'ci'        // CI configuration changes
        ]],
        'subject-case': [0], // Allow any case for subject
        'header-max-length': [2, 'always', 100]
    }
};
