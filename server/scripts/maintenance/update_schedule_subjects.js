const ExcelJS = require('exceljs');
const path = require('path');

const REAL_SUBJECTS = {
    'IT': {
        'FY': ['Web Design', 'Database Management', 'Programming in C'],
        'SY': ['Data Structures', 'Operating Systems', 'Computer Networks'],
        'TY': ['Software Engineering', 'Cloud Computing', 'Mobile App Development']
    },
    'CS': {
        'FY': ['Programming Fundamentals', 'Discrete Mathematics', 'Computer Organization'],
        'SY': ['Algorithms', 'Theory of Computation', 'Compiler Design'],
        'TY': ['Artificial Intelligence', 'Machine Learning', 'Computer Graphics']
    },
    'DS': {
        'FY': ['Python Programming', 'Statistics for Data Science', 'Data Visualization'],
        'SY': ['Big Data Analytics', 'Deep Learning', 'Natural Language Processing'],
        'TY': ['Data Mining', 'Business Intelligence', 'Predictive Analytics']
    },
    'BAF': {
        'FY': ['Financial Accounting', 'Business Economics', 'Business Mathematics'],
        'SY': ['Corporate Finance', 'Taxation', 'Auditing'],
        'TY': ['Investment Management', 'Financial Markets', 'Risk Management']
    },
    'BMS': {
        'FY': ['Principles of Management', 'Business Communication', 'Marketing Management'],
        'SY': ['Human Resource Management', 'Operations Management', 'Organizational Behavior'],
        'TY': ['Strategic Management', 'Entrepreneurship', 'Business Analytics']
    },
    'BAMMC': {
        'FY': ['Introduction to Media', 'Communication Skills', 'Media Laws'],
        'SY': ['Journalism', 'Advertising', 'Public Relations'],
        'TY': ['Film Studies', 'Digital Media', 'Media Research']
    }
};

// Map teacher emails to departments
const getDeptFromEmail = (email) => {
    if (email.includes('it.prof')) return 'IT';
    if (email.includes('cs.prof')) return 'CS';
    if (email.includes('ds.prof')) return 'DS';
    if (email.includes('baf.prof')) return 'BAF';
    if (email.includes('bms.prof')) return 'BMS';
    if (email.includes('bammc.prof')) return 'BAMMC';
    return null;
};

async function updateScheduleSubjects() {
    console.log('🔄 Updating Master Schedule with Real Subjects\n');

    const filePath = path.join(__dirname, '../sample_data/Master Schedule/05_Lecture_Schedule.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    // Find column indices
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNum) => {
        headers[colNum] = cell.value?.toString().toLowerCase() || '';
    });

    const subjectIdx = headers.indexOf('subject');
    const classYearIdx = headers.indexOf('class_year');
    const teacherEmailIdx = headers.indexOf('teacher_email');

    let updated = 0;
    const usedSubjects = {};

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const teacherEmail = row.getCell(teacherEmailIdx).value?.toString();
        const classYear = row.getCell(classYearIdx).value?.toString();

        if (!teacherEmail || !classYear) return;

        const dept = getDeptFromEmail(teacherEmail);
        if (!dept || !REAL_SUBJECTS[dept] || !REAL_SUBJECTS[dept][classYear]) return;

        // Track usage to distribute subjects evenly
        const key = `${dept}-${classYear}`;
        if (!usedSubjects[key]) usedSubjects[key] = {};

        const availableSubjects = REAL_SUBJECTS[dept][classYear];

        // Pick subject with least usage
        let chosenSubject = availableSubjects[0];
        let minUsage = usedSubjects[key][chosenSubject] || 0;

        for (const subject of availableSubjects) {
            const usage = usedSubjects[key][subject] || 0;
            if (usage < minUsage) {
                minUsage = usage;
                chosenSubject = subject;
            }
        }

        row.getCell(subjectIdx).value = chosenSubject;
        usedSubjects[key][chosenSubject] = (usedSubjects[key][chosenSubject] || 0) + 1;
        updated++;
    });

    await workbook.xlsx.writeFile(filePath);

    console.log(`✅ Updated ${updated} lecture subjects\n`);
    console.log('📊 Subject Distribution:');
    Object.keys(usedSubjects).sort().forEach(key => {
        console.log(`\n  ${key}:`);
        Object.entries(usedSubjects[key]).forEach(([subject, count]) => {
            console.log(`    ${subject}: ${count} lectures`);
        });
    });
}

updateScheduleSubjects().catch(console.error);
