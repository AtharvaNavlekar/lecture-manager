const ExcelJS = require('exceljs');
const path = require('path');

async function fixMasterSchedule() {
    console.log('🔧 Fixing Master Schedule File\n');

    const filePath = path.join(__dirname, '../sample_data/Master Schedule/05_Lecture_Schedule.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    // Get current week's Monday as base date (use Jan 13, 2026 as Monday)
    const getDateForDay = (dayOfWeek) => {
        const dayMap = {
            'monday': 0,
            'tuesday': 1,
            'wednesday': 2,
            'thursday': 3,
            'friday': 4,
            'saturday': 5,
            'sunday': 6
        };

        const baseMonday = new Date('2026-01-13'); // A Monday
        const dayOffset = dayMap[dayOfWeek.toLowerCase()];
        const targetDate = new Date(baseMonday);
        targetDate.setDate(baseMonday.getDate() + dayOffset);

        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // Find header row indices
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNum) => {
        headers[colNum] = cell.value?.toString().toLowerCase() || '';
    });

    const dayIndex = headers.indexOf('day_of_week');

    // Insert date column after day_of_week
    if (dayIndex > 0) {
        worksheet.spliceColumns(dayIndex + 1, 0, ['date']);
        console.log(`✅ Inserted 'date' column at position ${dayIndex + 1}`);

        // Populate dates
        let populated = 0;
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const dayCell = row.getCell(dayIndex);
            const dateCell = row.getCell(dayIndex + 1);

            if (dayCell.value) {
                const date = getDateForDay(dayCell.value.toString());
                dateCell.value = date;
                populated++;
            }
        });

        console.log(`✅ Populated ${populated} date values`);
    }

    // Save
    await workbook.xlsx.writeFile(filePath);
    console.log('\n🎉 Master Schedule file updated successfully!');
    console.log('📅 Dates generated for week of January 13-19, 2026');
}

fixMasterSchedule().catch(console.error);
