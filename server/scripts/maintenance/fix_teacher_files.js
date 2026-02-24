const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

async function fixTeacherFile(filePath, correctDept) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    let fixed = 0;

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const deptCell = row.getCell(3); // Department is 3rd column
        if (deptCell.value) {
            const original = deptCell.value.toString();
            if (original.includes('B.Sc.') || original.includes('BSc')) {
                deptCell.value = correctDept;
                fixed++;
            }
        }
    });

    await workbook.xlsx.writeFile(filePath);
    return fixed;
}

async function fixAllTeacherFiles() {
    console.log('🔧 Fixing Teacher Sample Files\n');

    const baseDir = path.join(__dirname, '../sample_data/Faculty Management');

    const fixes = [
        { file: '01_Teachers_B_Sc__CS.xlsx', dept: 'CS' },
        { file: '01_Teachers_B_Sc__Data_Science.xlsx', dept: 'DS' },
        { file: '01_Teachers_B_Sc__IT.xlsx', dept: 'IT' }
    ];

    for (const fix of fixes) {
        const filePath = path.join(baseDir, fix.file);
        const count = await fixTeacherFile(filePath, fix.dept);
        console.log(`✅ Fixed ${fix.file}: Updated ${count} rows to department "${fix.dept}"`);
    }

    console.log('\n🎉 All teacher files corrected!');
}

fixAllTeacherFiles().catch(console.error);
