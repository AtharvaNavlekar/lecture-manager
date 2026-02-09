const { parseExcel, validateLectureData } = require('./utils/excelParser');
const fs = require('fs').promises;
const path = require('path');

async function analyzeScheduleFile() {
    console.log('🔍 Analyzing Master Schedule File\n');

    const scheduleFile = path.join(__dirname, '../sample_data/Master Schedule/05_Lecture_Schedule.xlsx');

    try {
        const buffer = await fs.readFile(scheduleFile);
        const rows = await parseExcel(buffer);

        console.log(`📊 Parsed ${rows.length} rows\n`);

        // Show first row structure
        if (rows.length > 0) {
            console.log('First Row Structure:');
            console.log(JSON.stringify(rows[0], null, 2));
            console.log('\nHeaders found:', Object.keys(rows[0]));
        }

        // Validate
        const validation = validateLectureData(rows);

        console.log(`\n📋 Validation Results:`);
        console.log(`Total: ${validation.total}`);
        console.log(`Valid: ${validation.validRows.length}`);
        console.log(`Errors: ${validation.errors.length}`);

        if (validation.errors.length > 0) {
            console.log('\n❌ Sample Errors:');
            validation.errors.slice(0, 5).forEach(err => {
                console.log(`  Row ${err.row}: ${err.errors.join(', ')}`);
                console.log(`  Data:`, JSON.stringify(err.data, null, 4));
            });
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

analyzeScheduleFile();
