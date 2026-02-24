const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    'lectures.xlsx',
    'students.xlsx',
    'subjects.xlsx',
    'teachers.xlsx',
    'timetable_all_depts.xlsx'
];

const basePath = path.join(__dirname, 'uploads', 'resources');

console.log('--- Inspecting Excel Files ---');

files.forEach(file => {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
        console.log(`\n[MISSING] ${file}`);
        return;
    }

    console.log(`\n[FILE] ${file}`);
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get headers
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const headers = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            headers.push(cell ? cell.v : undefined);
        }
        console.log('Headers:', headers);

        // Get first 3 rows of data
        const data = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 1 }).slice(0, 3);
        console.log('Sample Data:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
});
