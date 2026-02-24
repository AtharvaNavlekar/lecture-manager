const fs = require('fs');
const glob = require('glob');
const path = require('path');

console.log('🔧 Auto-fixing console.log statements...\n');

// Find all JavaScript and JSX files in client/src
const files = glob.sync('client/src/**/*.{js,jsx}', {
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
});

let filesModified = 0;
let statementsReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let localReplacements = 0;

    // Check if logger is already imported
    const hasLoggerImport = content.includes("import logger from") || content.includes("import { logger }");

    // Count console statements
    const consoleMatches = content.match(/console\.(log|warn|error|debug|info)/g) || [];

    if (consoleMatches.length > 0 && !hasLoggerImport) {
        // Add logger import at the top (after other imports)
        const importMatch = content.match(/(import .+ from .+;\n)+/);
        if (importMatch) {
            const lastImportEnd = importMatch[0].length;
            content = content.slice(0, lastImportEnd) +
                "import logger from '@/utils/logger';\n" +
                content.slice(lastImportEnd);
        } else {
            // No imports found, add at the very top
            content = "import logger from '@/utils/logger';\n\n" + content;
        }
        modified = true;
    }

    // Replace console.log with logger.debug
    if (content.includes('console.log')) {
        const before = content;
        content = content.replace(/console\.log/g, 'logger.debug');
        if (content !== before) {
            localReplacements += (before.match(/console\.log/g) || []).length;
            modified = true;
        }
    }

    // Replace console.warn with logger.warn
    if (content.includes('console.warn')) {
        const before = content;
        content = content.replace(/console\.warn/g, 'logger.warn');
        if (content !== before) {
            localReplacements += (before.match(/console\.warn/g) || []).length;
            modified = true;
        }
    }

    // Replace console.error with logger.error
    if (content.includes('console.error')) {
        const before = content;
        content = content.replace(/console\.error/g, 'logger.error');
        if (content !== before) {
            localReplacements += (before.match(/console\.error/g) || []).length;
            modified = true;
        }
    }

    // Replace console.info with logger.info
    if (content.includes('console.info')) {
        const before = content;
        content = content.replace(/console\.info/g, 'logger.info');
        if (content !== before) {
            localReplacements += (before.match(/console\.info/g) || []).length;
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file}: ${localReplacements} replacement(s)`);
        filesModified++;
        statementsReplaced += localReplacements;
    }
});

console.log(`\n✅ Auto-fix complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Console statements replaced: ${statementsReplaced}\n`);

if (filesModified > 0) {
    console.log('⚠️  Please review the changes and test your application.');
}
