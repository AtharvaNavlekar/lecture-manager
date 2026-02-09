const { parseExcel, validateLectureData } = require('./utils/excelParser');
const fs = require('fs').promises;
const path = require('path');

async function analyzeScheduleIssues() {
    console.log('🔍 Comprehensive Master Schedule Analysis\n');

    const scheduleFile = path.join(__dirname, '../sample_data/Master Schedule/05_Lecture_Schedule.xlsx');

    try {
        const buffer = await fs.readFile(scheduleFile);
        const rows = await parseExcel(buffer);

        console.log(`📊 Total Rows: ${rows.length}\n`);

        // Check structure
        if (rows.length > 0) {
            console.log('📋 File Structure:');
            console.log('Headers:', Object.keys(rows[0]).join(', '));
            console.log('');
        }

        // Validate
        const validation = validateLectureData(rows);

        console.log('✅ Validation Results:');
        console.log(`  Valid: ${validation.validRows.length}`);
        console.log(`  Errors: ${validation.errors.length}`);
        console.log(`  Total: ${validation.total}`);
        console.log('');

        // Analyze data quality
        const issues = [];
        const stats = {
            departments: new Set(),
            classYears: new Set(),
            divisions: new Set(),
            daysOfWeek: new Set(),
            subjects: new Set(),
            teachers: new Set()
        };

        validation.validRows.forEach(row => {
            if (row.teacher_email) {
                const dept = row.teacher_email.split('.')[0];
                stats.departments.add(dept);
                stats.teachers.add(row.teacher_email);
            }
            if (row.class_year) stats.classYears.add(row.class_year);
            if (row.division) stats.divisions.add(row.division);
            if (row.day_of_week) stats.daysOfWeek.add(row.day_of_week);
            if (row.subject) stats.subjects.add(row.subject);
        });

        console.log('📊 Data Distribution:');
        console.log(`  Departments: ${Array.from(stats.departments).join(', ')}`);
        console.log(`  Class Years: ${Array.from(stats.classYears).join(', ')}`);
        console.log(`  Divisions: ${Array.from(stats.divisions).join(', ')}`);
        console.log(`  Days: ${Array.from(stats.daysOfWeek).join(', ')}`);
        console.log(`  Unique Subjects: ${stats.subjects.size}`);
        console.log(`  Unique Teachers: ${stats.teachers.size}`);
        console.log('');

        // Check for specific issues
        console.log('🔍 Issue Detection:');

        // Check if has day_of_week
        const hasDayOfWeek = validation.validRows.every(r => r.day_of_week);
        console.log(`  ✓ Has day_of_week: ${hasDayOfWeek ? 'YES' : 'NO - ISSUE!'}`);

        // Check if has date (should be null for recurring)
        const hasDate = validation.validRows.some(r => r.date);
        console.log(`  ${hasDate ? '⚠' : '✓'} Has date field: ${hasDate ? 'YES (should be null for recurring)' : 'NO (correct for recurring)'}`);

        // Check balance
        const lecturesPerDay = {};
        validation.validRows.forEach(r => {
            const day = r.day_of_week;
            lecturesPerDay[day] = (lecturesPerDay[day] || 0) + 1;
        });

        console.log('\n📅 Lectures Per Day:');
        Object.entries(lecturesPerDay).sort().forEach(([day, count]) => {
            console.log(`  ${day}: ${count} lectures`);
        });

        // Show errors if any
        if (validation.errors.length > 0) {
            console.log('\n❌ Validation Errors:');
            validation.errors.slice(0, 5).forEach(err => {
                console.log(`  Row ${err.row}: ${err.errors.join(', ')}`);
            });
            if (validation.errors.length > 5) {
                console.log(`  ... and ${validation.errors.length - 5} more errors`);
            }
        }

        console.log('\n📋 Summary:');
        if (validation.errors.length === 0 && hasDayOfWeek) {
            console.log('  ✅ File is ready for import!');
        } else {
            console.log('  ⚠️  Issues found - see above');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

analyzeScheduleIssues();
