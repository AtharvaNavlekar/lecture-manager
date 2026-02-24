const ExcelJS = require('exceljs');
const path = require('path');

async function revertToRecurring() {
    console.log('🔄 Converting Master Schedule to Recurring Template\n');

    const filePath = path.join(__dirname, '../sample_data/Master Schedule/05_Lecture_Schedule.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    // Find date column
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNum) => {
        headers[colNum] = cell.value?.toString().toLowerCase() || '';
    });

    const dateIndex = headers.indexOf('date');

    if (dateIndex > 0) {
        // Remove date column
        worksheet.spliceColumns(dateIndex, 1);
        console.log(`✅ Removed 'date' column (was at position ${dateIndex})`);
    }

    // Save
    await workbook.xlsx.writeFile(filePath);
    console.log('\n🎉 Master Schedule reverted to recurring weekly template!');
    console.log('📋 Schedule is now date-independent and repeats every week');
}

revertToRecurring().catch(console.error);
