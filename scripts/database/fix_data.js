const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const basePath = path.join(__dirname, 'uploads', 'resources');

// Helper to read/write
function readSheet(filename) {
    const filePath = path.join(basePath, filename);
    if (!fs.existsSync(filePath)) return [];
    const workbook = XLSX.readFile(filePath);
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
}

function writeSheet(filename, data) {
    const filePath = path.join(basePath, filename);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filePath);
    console.log(`Saved ${filename}`);
}

// 1. Load Data
console.log("Loading data...");
let subjects = readSheet('subjects.xlsx');
let timetable = readSheet('timetable_all_depts.xlsx');
let lectures = readSheet('lectures.xlsx');

// 2. Define Mappings (Abbr -> Full Name) based on analysis
const subjectMap = {
    'IoT': 'Internet of Things',
    'DS': 'Data Structures',
    'DBMS': 'Database Management',
    'Network': 'Computer Networks',
    'Digital': 'Digital Logic',
    'Discrete': 'Discrete Mathematics',
    'SW-Eng': 'Software Engineering',
    'Linux': 'Linux Administration',
    'ML-Intro': 'Machine Learning',
    'Deep-L': 'Deep Learning',
    'AI-Found': 'Artificial Intelligence',
    'Stats': 'Statistics for Data Science', // Best guess from subject list
    'Stats-I': 'Statistics for Data Science'
};

const knownSubjects = new Set(subjects.map(s => s.Name.trim()));

// 3. Clean Function
function cleanSubject(name) {
    if (!name) return name;
    let clean = name.trim();

    // Strip " (Lab XX)" or similar
    // Regex: look for (Lab followed by anything)
    clean = clean.replace(/\s*\(Lab.*?\)/i, '');

    // Apply Mapping
    if (subjectMap[clean]) {
        clean = subjectMap[clean];
    }

    return clean;
}

// 4. Process Timetable & Lectures
console.log("Cleaning Timetable and Lectures...");
let fixedCount = 0;

[timetable, lectures].forEach(dataset => {
    dataset.forEach(row => {
        const original = row.Subject;
        const cleaned = cleanSubject(original);
        if (original !== cleaned) {
            row.Subject = cleaned;
            fixedCount++;
        }
    });
});

console.log(`Fixed ${fixedCount} subject names in scheduled data.`);

// 5. Identify Missing Subjects in Master List
const usedSubjects = new Set();
[timetable, lectures].forEach(dataset => {
    dataset.forEach(row => {
        if (row.Subject) usedSubjects.add(row.Subject.trim());
    });
});

const missing = [];
usedSubjects.forEach(s => {
    // Case insensitive check
    const match = subjects.find(sub => sub.Name.trim().toLowerCase() === s.toLowerCase());
    if (!match) {
        missing.push(s);
    }
});

console.log(`Found ${missing.length} subjects missing from master list:`, missing);

// 6. Add Missing Subjects to subjects.xlsx
if (missing.length > 0) {
    missing.forEach(m => {
        subjects.push({
            Name: m,
            Code: 'GEN-' + Math.floor(Math.random() * 1000), // Generate placeholder code
            Department: 'General', // Default, difficult to infer without more logic
            ClassYear: 'ALL'
        });
    });
    console.log("Added missing subjects to master list.");
}

// 7. Save All
writeSheet('subjects.xlsx', subjects);
writeSheet('timetable_all_depts.xlsx', timetable);
writeSheet('lectures.xlsx', lectures);

console.log("Done!");
