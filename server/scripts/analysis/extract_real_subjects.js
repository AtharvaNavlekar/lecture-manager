const { parseExcel } = require('./utils/excelParser');
const fs = require('fs').promises;
const path = require('path');

async function extractSubjectsFromSubjectFiles() {
    console.log('🔍 Extracting Subjects from Subject Management Files\n');

    const subjectDir = path.join(__dirname, '../sample_data/Subject Management/Subjects');
    const subjectFiles = await fs.readdir(subjectDir);

    const allSubjects = {};

    for (const file of subjectFiles.filter(f => f.endsWith('.xlsx'))) {
        console.log(`📚 Analyzing ${file}...`);
        const buffer = await fs.readFile(path.join(subjectDir, file));
        const rows = await parseExcel(buffer);

        const dept = file.replace('02_Subjects_', '').replace('.xlsx', '').replace(/_/g, ' ');

        if (!allSubjects[dept]) allSubjects[dept] = {};

        rows.forEach(row => {
            const classYear = row.class_year || row.ClassYear || row['Class Year'];
            const subjectName = row.name || row.Name || row['Subject Name'];

            if (!allSubjects[dept][classYear]) allSubjects[dept][classYear] = [];
            if (subjectName) allSubjects[dept][classYear].push(subjectName);
        });

        console.log(`  Found ${rows.length} subjects`);
    }

    console.log('\n📊 SUBJECT BREAKDOWN BY DEPARTMENT:\n');

    for (const dept in allSubjects) {
        console.log(`🏛️ ${dept}:`);
        for (const year in allSubjects[dept]) {
            console.log(`  ${year}: ${allSubjects[dept][year].length} subjects`);
            allSubjects[dept][year].forEach((sub, i) => {
                console.log(`    ${i + 1}. ${sub}`);
            });
        }
        console.log('');
    }

    // Save to JSON for reference
    await fs.writeFile(
        path.join(__dirname, '../subjects_by_department.json'),
        JSON.stringify(allSubjects, null, 2)
    );
    console.log('\n💾 Saved to subjects_by_department.json');
}

extractSubjectsFromSubjectFiles().catch(console.error);
