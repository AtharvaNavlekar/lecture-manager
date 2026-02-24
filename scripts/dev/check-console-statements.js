const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
let hasConsoleStatements = false;
let errorCount = 0;

// Files where console statements are allowed
const ALLOWED_FILES = [
    'vite.config.js',
    'tailwind.config.js',
    'ecosystem.config.js',
    'knexfile.js'
];

// Patterns to detect console statements (not in comments)
const CONSOLE_PATTERN = /(?<!\/\/\s*)(?<!\/\*[\s\S]*?)console\.(log|warn|error|debug|info|trace)/g;

console.log('🔍 Checking for console statements...\n');

files.forEach(file => {
    const basename = path.basename(file);

    // Skip allowed files
    if (ALLOWED_FILES.includes(basename)) {
        console.log(`✓ Skipping ${basename} (allowed file)`);
        return;
    }

    // Skip if file doesn't exist
    if (!fs.existsSync(file)) {
        return;
    }

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    let fileHasErrors = false;

    lines.forEach((line, index) => {
        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
        }

        // Check for console statements
        const matches = line.match(CONSOLE_PATTERN);
        if (matches) {
            if (!fileHasErrors) {
                console.log(`\n❌ ${file}:`);
                fileHasErrors = true;
                hasConsoleStatements = true;
            }

            console.log(`   Line ${index + 1}: ${line.trim()}`);
            errorCount++;
        }
    });
});

if (hasConsoleStatements) {
    console.log(`\n\n❌ Found ${errorCount} console statement(s) in ${files.length} file(s)`);
    console.log('\n💡 Tips:');
    console.log('   - Use logger.debug() instead of console.log()');
    console.log('   - Use logger.info() for informational messages');
    console.log('   - Use logger.warn() for warnings');
    console.log('   - Use logger.error() for errors');
    console.log('\n   Run this to auto-fix:');
    console.log('   node scripts/auto-fix-console-logs.js\n');
    process.exit(1);
} else {
    console.log('\n✅ No console statements found');
    process.exit(0);
}
