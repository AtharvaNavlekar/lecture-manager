const { parseExcel, validateTeacherData, validateStudentData } = require('./utils/excelParser');
const fs = require('fs').promises;
const path = require('path');

async function analyzeSampleData() {
    console.log('🔍 Analyzing Sample Data Files\n');

    const results = {
        teachers: [],
        students: [],
        issues: []
    };

    // Analyze Teacher Files
    console.log('📋 TEACHER FILES:');
    const teacherDir = path.join(__dirname, '../sample_data/Faculty Management');
    const teacherFiles = await fs.readdir(teacherDir);

    for (const file of teacherFiles.filter(f => f.endsWith('.xlsx'))) {
        try {
            const buffer = await fs.readFile(path.join(teacherDir, file));
            const rows = await parseExcel(buffer);
            const validation = await validateTeacherData(rows);

            results.teachers.push({
                file,
                totalRows: validation.total,
                validRows: validation.validRows.length,
                errors: validation.errors.length
            });

            console.log(`  ✓ ${file}`);
            console.log(`    Total: ${validation.total}, Valid: ${validation.validRows.length}, Errors: ${validation.errors.length}`);

            if (validation.errors.length > 0) {
                console.log(`    Issues:`);
                validation.errors.slice(0, 3).forEach(err => {
                    console.log(`      Row ${err.row}: ${err.errors.join(', ')}`);
                });
                results.issues.push({ file, category: 'teachers', errors: validation.errors });
            }
        } catch (err) {
            console.log(`  ❌ ${file}: ${err.message}`);
            results.issues.push({ file, category: 'teachers', errors: [{ error: err.message }] });
        }
    }

    // Analyze Student Files
    console.log('\n📋 STUDENT FILES:');
    const studentDir = path.join(__dirname, '../sample_data/Student Management');
    const studentFiles = await fs.readdir(studentDir);

    for (const file of studentFiles.filter(f => f.endsWith('.xlsx'))) {
        try {
            const buffer = await fs.readFile(path.join(studentDir, file));
            const rows = await parseExcel(buffer);
            const validation = await validateStudentData(rows);

            results.students.push({
                file,
                totalRows: validation.total,
                validRows: validation.validRows.length,
                errors: validation.errors.length
            });

            console.log(`  ✓ ${file}`);
            console.log(`    Total: ${validation.total}, Valid: ${validation.validRows.length}, Errors: ${validation.errors.length}`);

            if (validation.errors.length > 0) {
                console.log(`    Issues:`);
                validation.errors.slice(0, 3).forEach(err => {
                    console.log(`      Row ${err.row}: ${err.errors.join(', ')}`);
                });
                results.issues.push({ file, category: 'students', errors: validation.errors });
            }
        } catch (err) {
            console.log(`  ❌ ${file}: ${err.message}`);
            results.issues.push({ file, category: 'students', errors: [{ error: err.message }] });
        }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Teachers: ${results.teachers.length} files`);
    console.log(`Students: ${results.students.length} files`);
    console.log(`Files with issues: ${results.issues.length}`);

    if (results.issues.length > 0) {
        console.log('\n🔧 RECOMMENDED FIXES:');
        const teacherIssues = results.issues.filter(i => i.category === 'teachers');
        const studentIssues = results.issues.filter(i => i.category === 'students');

        if (teacherIssues.length > 0) {
            console.log('Teachers:');
            teacherIssues.forEach(i => console.log(`  • ${i.file}: ${i.errors.length} validation errors`));
        }
        if (studentIssues.length > 0) {
            console.log('Students:');
            studentIssues.forEach(i => console.log(`  • ${i.file}: ${i.errors.length} validation errors`));
        }
    }

    return results;
}

analyzeSampleData().then(results => {
    // Save detailed report
    require('fs').writeFileSync(
        path.join(__dirname, '../sample_data_analysis.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\n📄 Detailed report saved to: sample_data_analysis.json');
}).catch(console.error);
