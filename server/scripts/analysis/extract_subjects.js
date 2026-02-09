const { parseExcel } = require('./utils/excelParser');
const fs = require('fs').promises;
const path = require('path');

async function extractSubjectsFromStudents() {
    console.log('🔍 Extracting Subjects from Student Files\n');

    const studentDir = path.join(__dirname, '../sample_data/Student Management');
    const studentFiles = await fs.readdir(studentDir);

    const subjectsByDept = {};

    for (const file of studentFiles.filter(f => f.endsWith('.xlsx'))) {
        console.log(`📋 Analyzing ${file}...`);
        const buffer = await fs.readFile(path.join(studentDir, file));
        const rows = await parseExcel(buffer);

        if (rows.length > 0) {
            const firstRow = rows[0];
            console.log('  Headers:', Object.keys(firstRow).join(', '));
            console.log('  Sample row:', JSON.stringify(rows[0], null, 2));
            console.log('  Total students:', rows.length);
        }
        console.log('');
    }
}

extractSubjectsFromStudents().catch(console.error);
