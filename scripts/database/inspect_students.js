const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'uploads', 'resources', 'students.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log("Total rows:", data.length);
    if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
        console.log("Sample row:", data[0]);
    }

    const counts = {};
    const departments = new Set();

    data.forEach(row => {
        const cls = row['ClassYear'] || row['Class Year'] || 'Unknown';
        counts[cls] = (counts[cls] || 0) + 1;
        if (row['Department']) departments.add(row['Department']);
    });

    console.log("Counts per ClassYear:", counts);
    console.log("Departments found:", Array.from(departments));

} catch (err) {
    console.error("Error reading file:", err.message);
}
