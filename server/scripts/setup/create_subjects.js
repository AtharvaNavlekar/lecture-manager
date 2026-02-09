const { db } = require('../config/db');

async function createSubjects() {
    console.log("📚 Creating Real Subjects...\n");

    // Clear existing subjects
    await new Promise((resolve) => {
        db.run("DELETE FROM subjects", resolve);
    });

    const subjects = [
        // B.Sc. IT
        { code: 'IT101', name: 'Web Design', department: 'B.Sc. IT', semester: 1, credits: 4 },
        { code: 'IT102', name: 'Database Management', department: 'B.Sc. IT', semester: 1, credits: 4 },
        { code: 'IT103', name: 'Programming in C', department: 'B.Sc. IT', semester: 1, credits: 4 },
        { code: 'IT201', name: 'Data Structures', department: 'B.Sc. IT', semester: 3, credits: 4 },
        { code: 'IT202', name: 'Operating Systems', department: 'B.Sc. IT', semester: 3, credits: 4 },
        { code: 'IT203', name: 'Computer Networks', department: 'B.Sc. IT', semester: 3, credits: 4 },
        { code: 'IT301', name: 'Software Engineering', department: 'B.Sc. IT', semester: 5, credits: 4 },
        { code: 'IT302', name: 'Cloud Computing', department: 'B.Sc. IT', semester: 5, credits: 4 },
        { code: 'IT303', name: 'Mobile App Development', department: 'B.Sc. IT', semester: 5, credits: 4 },

        // B.Sc. CS
        { code: 'CS101', name: 'Programming Fundamentals', department: 'B.Sc. CS', semester: 1, credits: 4 },
        { code: 'CS102', name: 'Discrete Mathematics', department: 'B.Sc. CS', semester: 1, credits: 4 },
        { code: 'CS103', name: 'Computer Organization', department: 'B.Sc. CS', semester: 1, credits: 4 },
        { code: 'CS201', name: 'Algorithms', department: 'B.Sc. CS', semester: 3, credits: 4 },
        { code: 'CS202', name: 'Theory of Computation', department: 'B.Sc. CS', semester: 3, credits: 4 },
        { code: 'CS203', name: 'Compiler Design', department: 'B.Sc. CS', semester: 3, credits: 4 },
        { code: 'CS301', name: 'Artificial Intelligence', department: 'B.Sc. CS', semester: 5, credits: 4 },
        { code: 'CS302', name: 'Machine Learning', department: 'B.Sc. CS', semester: 5, credits: 4 },
        { code: 'CS303', name: 'Computer Graphics', department: 'B.Sc. CS', semester: 5, credits: 4 },

        // B.Sc. Data Science
        { code: 'DS101', name: 'Python Programming', department: 'B.Sc. Data Science', semester: 1, credits: 4 },
        { code: 'DS102', name: 'Statistics for Data Science', department: 'B.Sc. Data Science', semester: 1, credits: 4 },
        { code: 'DS103', name: 'Data Visualization', department: 'B.Sc. Data Science', semester: 1, credits: 4 },
        { code: 'DS201', name: 'Big Data Analytics', department: 'B.Sc. Data Science', semester: 3, credits: 4 },
        { code: 'DS202', name: 'Deep Learning', department: 'B.Sc. Data Science', semester: 3, credits: 4 },
        { code: 'DS203', name: 'Natural Language Processing', department: 'B.Sc. Data Science', semester: 3, credits: 4 },
        { code: 'DS301', name: 'Data Mining', department: 'B.Sc. Data Science', semester: 5, credits: 4 },
        { code: 'DS302', name: 'Business Intelligence', department: 'B.Sc. Data Science', semester: 5, credits: 4 },
        { code: 'DS303', name: 'Predictive Analytics', department: 'B.Sc. Data Science', semester: 5, credits: 4 },

        // BAF
        { code: 'BAF101', name: 'Financial Accounting', department: 'BAF', semester: 1, credits: 4 },
        { code: 'BAF102', name: 'Business Economics', department: 'BAF', semester: 1, credits: 4 },
        { code: 'BAF103', name: 'Business Mathematics', department: 'BAF', semester: 1, credits: 4 },
        { code: 'BAF201', name: 'Corporate Finance', department: 'BAF', semester: 3, credits: 4 },
        { code: 'BAF202', name: 'Taxation', department: 'BAF', semester: 3, credits: 4 },
        { code: 'BAF203', name: 'Auditing', department: 'BAF', semester: 3, credits: 4 },
        { code: 'BAF301', name: 'Investment Management', department: 'BAF', semester: 5, credits: 4 },
        { code: 'BAF302', name: 'Financial Markets', department: 'BAF', semester: 5, credits: 4 },
        { code: 'BAF303', name: 'Risk Management', department: 'BAF', semester: 5, credits: 4 },

        // BAMMC
        { code: 'BMM101', name: 'Introduction to Media', department: 'BAMMC', semester: 1, credits: 4 },
        { code: 'BMM102', name: 'Communication Skills', department: 'BAMMC', semester: 1, credits: 4 },
        { code: 'BMM103', name: 'Media Laws', department: 'BAMMC', semester: 1, credits: 4 },
        { code: 'BMM201', name: 'Journalism', department: 'BAMMC', semester: 3, credits: 4 },
        { code: 'BMM202', name: 'Advertising', department: 'BAMMC', semester: 3, credits: 4 },
        { code: 'BMM203', name: 'Public Relations', department: 'BAMMC', semester: 3, credits: 4 },
        { code: 'BMM301', name: 'Film Studies', department: 'BAMMC', semester: 5, credits: 4 },
        { code: 'BMM302', name: 'Digital Media', department: 'BAMMC', semester: 5, credits: 4 },
        { code: 'BMM303', name: 'Media Research', department: 'BAMMC', semester: 5, credits: 4 },

        // BMS
        { code: 'BMS101', name: 'Principles of Management', department: 'BMS', semester: 1, credits: 4 },
        { code: 'BMS102', name: 'Business Communication', department: 'BMS', semester: 1, credits: 4 },
        { code: 'BMS103', name: 'Marketing Management', department: 'BMS', semester: 1, credits: 4 },
        { code: 'BMS201', name: 'Human Resource Management', department: 'BMS', semester: 3, credits: 4 },
        { code: 'BMS202', name: 'Operations Management', department: 'BMS', semester: 3, credits: 4 },
        { code: 'BMS203', name: 'Organizational Behavior', department: 'BMS', semester: 3, credits: 4 },
        { code: 'BMS301', name: 'Strategic Management', department: 'BMS', semester: 5, credits: 4 },
        { code: 'BMS302', name: 'Entrepreneurship', department: 'BMS', semester: 5, credits: 4 },
        { code: 'BMS303', name: 'Business Analytics', department: 'BMS', semester: 5, credits: 4 },
    ];

    console.log(`Creating ${subjects.length} subjects...\n`);

    const promises = [];
    for (const subject of subjects) {
        // Map semester to class_year
        const classYear = subject.semester === 1 ? 'FY' : subject.semester === 3 ? 'SY' : 'TY';

        const promise = new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO subjects (code, name, department, class_year) VALUES (?, ?, ?, ?)`,
                [subject.code, subject.name, subject.department, classYear],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        promises.push(promise);
    }

    await Promise.all(promises);
    console.log(`✅ Created ${subjects.length} subjects`);

    // Display by department
    const depts = ['B.Sc. IT', 'B.Sc. CS', 'B.Sc. Data Science', 'BAF', 'BAMMC', 'BMS'];
    for (const dept of depts) {
        const deptSubjects = subjects.filter(s => s.department === dept);
        console.log(`\n${dept}: ${deptSubjects.length} subjects`);
        deptSubjects.forEach(s => console.log(`  - ${s.code}: ${s.name}`));
    }
}

createSubjects()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
