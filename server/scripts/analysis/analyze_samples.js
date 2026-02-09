const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

// Expected schemas
const schemas = {
    teachers: ['name', 'email', 'department', 'post', 'is_hod'],
    students: ['name', 'roll_no', 'email', 'class_year', 'department'],
    subjects: ['name', 'code', 'department', 'class_year'],
    lectures: ['date', 'start_time', 'end_time', 'subject', 'teacher_email', 'class_year', 'room', 'division']
};

async function validateExcelFile(filePath, expectedType) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const headers = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell) => {
        headers.push(cell.value?.toString().trim().toLowerCase() || '');
    });

    const rowCount = worksheet.rowCount - 1; // Exclude header

    return {
        file: path.basename(filePath),
        headers,
        rowCount,
        issues: []
    };
}

async function analyzeDirectory(dir, type) {
    const files = await fs.readdir(dir);
    const results = [];

    for (const file of files) {
        if (file.endsWith('.xlsx')) {
            const result = await validateExcelFile(path.join(dir, file), type);

            // Check for missing required columns
            const expected = schemas[type];
            const missing = expected.filter(col => !result.headers.includes(col));
            const extra = result.headers.filter(col => col && !expected.includes(col));

            if (missing.length > 0) result.issues.push(`Missing columns: ${missing.join(', ')}`);
            if (extra.length > 0) result.issues.push(`Extra columns: ${extra.join(', ')}`);
            if (result.rowCount === 0) result.issues.push('No data rows');

            results.push(result);
        }
    }

    return results;
}

async function main() {
    console.log('🔍 Analyzing sample data files...\n');

    const baseDir = path.resolve(__dirname, 'sample_data');

    // Analyze Faculty
    console.log('📋 FACULTY FILES:');
    const faculty = await analyzeDirectory(path.join(baseDir, 'Faculty Management'), 'teachers');
    faculty.forEach(f => {
        console.log(`  ✓ ${f.file}`);
        console.log(`    Headers: ${f.headers.join(', ')}`);
        console.log(`    Rows: ${f.rowCount}`);
        if (f.issues.length > 0) {
            f.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
        }
    });

    // Analyze Students
    console.log('\n📋 STUDENT FILES:');
    const students = await analyzeDirectory(path.join(baseDir, 'Student Management'), 'students');
    students.forEach(f => {
        console.log(`  ✓ ${f.file}`);
        console.log(`    Headers: ${f.headers.join(', ')}`);
        console.log(`    Rows: ${f.rowCount}`);
        if (f.issues.length > 0) {
            f.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
        }
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    const allFiles = [...faculty, ...students];
    const filesWithIssues = allFiles.filter(f => f.issues.length > 0);
    console.log(`Total files analyzed: ${allFiles.length}`);
    console.log(`Files with issues: ${filesWithIssues.length}`);

    if (filesWithIssues.length > 0) {
        console.log('\n🔧 FILES NEEDING FIXES:');
        filesWithIssues.forEach(f => {
            console.log(`  • ${f.file}: ${f.issues.join('; ')}`);
        });
    }
}

main().catch(console.error);
