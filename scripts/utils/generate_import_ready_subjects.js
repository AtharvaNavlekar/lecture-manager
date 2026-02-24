const XLSX = require('xlsx');
const path = require('path');

// Create simple import-ready format
const subjects = [];

// IT Department
const itSubjects = [
    { name: 'Programming Fundamentals', code: 'IT101', department: 'IT', class_year: 'FY' },
    { name: 'Digital Electronics', code: 'IT102', department: 'IT', class_year: 'FY' },
    { name: 'Discrete Mathematics', code: 'IT103', department: 'IT', class_year: 'FY' },
    { name: 'Communication Skills', code: 'IT104', department: 'IT', class_year: 'FY' },
    { name: 'Environmental Studies', code: 'IT105', department: 'IT', class_year: 'FY' },
    { name: 'Object Oriented Programming', code: 'IT106', department: 'IT', class_year: 'FY' },
    { name: 'Data Structures', code: 'IT107', department: 'IT', class_year: 'FY' },
    { name: 'Computer Organization', code: 'IT108', department: 'IT', class_year: 'FY' },
    { name: 'Web Technologies', code: 'IT109', department: 'IT', class_year: 'FY' },
    { name: 'Database Management Systems', code: 'IT110', department: 'IT', class_year: 'FY' },

    { name: 'Software Engineering', code: 'IT201', department: 'IT', class_year: 'SY' },
    { name: 'Operating Systems', code: 'IT202', department: 'IT', class_year: 'SY' },
    { name: 'Computer Networks', code: 'IT203', department: 'IT', class_year: 'SY' },
    { name: 'Theory of Computation', code: 'IT204', department: 'IT', class_year: 'SY' },
    { name: 'Python Programming', code: 'IT205', department: 'IT', class_year: 'SY' },
    { name: 'Advanced Java Programming', code: 'IT206', department: 'IT', class_year: 'SY' },
    { name: 'Information Security', code: 'IT207', department: 'IT', class_year: 'SY' },
    { name: 'Mobile Application Development', code: 'IT208', department: 'IT', class_year: 'SY' },
    { name: 'Cloud Computing', code: 'IT209', department: 'IT', class_year: 'SY' },
    { name: 'Data Analytics', code: 'IT210', department: 'IT', class_year: 'SY' },

    { name: 'Artificial Intelligence', code: 'IT301', department: 'IT', class_year: 'TY' },
    { name: 'Machine Learning', code: 'IT302', department: 'IT', class_year: 'TY' },
    { name: 'Big Data Analytics', code: 'IT303', department: 'IT', class_year: 'TY' },
    { name: 'Internet of Things', code: 'IT304', department: 'IT', class_year: 'TY' },
    { name: 'Blockchain Technology', code: 'IT305', department: 'IT', class_year: 'TY' },
    { name: 'DevOps and Automation', code: 'IT306', department: 'IT', class_year: 'TY' },
    { name: 'Cyber Security', code: 'IT307', department: 'IT', class_year: 'TY' },
    { name: 'Software Project Management', code: 'IT308', department: 'IT', class_year: 'TY' },
    { name: 'Natural Language Processing', code: 'IT309', department: 'IT', class_year: 'TY' },
    { name: 'Industry Project', code: 'IT310', department: 'IT', class_year: 'TY' }
];

// CS Department
const csSubjects = [
    { name: 'Programming in C', code: 'CS101', department: 'CS', class_year: 'FY' },
    { name: 'Digital Logic Design', code: 'CS102', department: 'CS', class_year: 'FY' },
    { name: 'Mathematics I', code: 'CS103', department: 'CS', class_year: 'FY' },
    { name: 'Technical Communication', code: 'CS104', department: 'CS', class_year: 'FY' },
    { name: 'Physics for Computing', code: 'CS105', department: 'CS', class_year: 'FY' },
    { name: 'C++ Programming', code: 'CS106', department: 'CS', class_year: 'FY' },
    { name: 'Data Structures & Algorithms', code: 'CS107', department: 'CS', class_year: 'FY' },
    { name: 'Mathematics II', code: 'CS108', department: 'CS', class_year: 'FY' },
    { name: 'Computer Architecture', code: 'CS109', department: 'CS', class_year: 'FY' },
    { name: 'Database Concepts', code: 'CS110', department: 'CS', class_year: 'FY' },

    { name: 'Advanced Data Structures', code: 'CS201', department: 'CS', class_year: 'SY' },
    { name: 'Operating System Concepts', code: 'CS202', department: 'CS', class_year: 'SY' },
    { name: 'Computer Networks', code: 'CS203', department: 'CS', class_year: 'SY' },
    { name: 'Microprocessors', code: 'CS204', department: 'CS', class_year: 'SY' },
    { name: 'Discrete Mathematics', code: 'CS205', department: 'CS', class_year: 'SY' },
    { name: 'Design & Analysis of Algorithms', code: 'CS206', department: 'CS', class_year: 'SY' },
    { name: 'Theory of Computation', code: 'CS207', department: 'CS', class_year: 'SY' },
    { name: 'Compiler Design', code: 'CS208', department: 'CS', class_year: 'SY' },
    { name: 'Software Engineering', code: 'CS209', department: 'CS', class_year: 'SY' },
    { name: 'Java Programming', code: 'CS210', department: 'CS', class_year: 'SY' },

    { name: 'Artificial Intelligence', code: 'CS301', department: 'CS', class_year: 'TY' },
    { name: 'Machine Learning', code: 'CS302', department: 'CS', class_year: 'TY' },
    { name: 'Computer Graphics', code: 'CS303', department: 'CS', class_year: 'TY' },
    { name: 'Distributed Systems', code: 'CS304', department: 'CS', class_year: 'TY' },
    { name: 'Cryptography', code: 'CS305', department: 'CS', class_year: 'TY' },
    { name: 'Deep Learning', code: 'CS306', department: 'CS', class_year: 'TY' },
    { name: 'Advanced Databases', code: 'CS307', department: 'CS', class_year: 'TY' },
    { name: 'Cloud Computing Architecture', code: 'CS308', department: 'CS', class_year: 'TY' },
    { name: 'Information Retrieval', code: 'CS309', department: 'CS', class_year: 'TY' },
    { name: 'Final Year Project', code: 'CS310', department: 'CS', class_year: 'TY' }
];

// DS Department
const dsSubjects = [
    { name: 'Introduction to Data Science', code: 'DS101', department: 'DS', class_year: 'FY' },
    { name: 'Python Programming', code: 'DS102', department: 'DS', class_year: 'FY' },
    { name: 'Statistics for Data Science', code: 'DS103', department: 'DS', class_year: 'FY' },
    { name: 'Mathematics for Data Science', code: 'DS104', department: 'DS', class_year: 'FY' },
    { name: 'Communication Skills', code: 'DS105', department: 'DS', class_year: 'FY' },
    { name: 'Advanced Python', code: 'DS106', department: 'DS', class_year: 'FY' },
    { name: 'Probability Theory', code: 'DS107', department: 'DS', class_year: 'FY' },
    { name: 'Data Structures', code: 'DS108', department: 'DS', class_year: 'FY' },
    { name: 'Database Systems', code: 'DS109', department: 'DS', class_year: 'FY' },
    { name: 'Data Visualization', code: 'DS110', department: 'DS', class_year: 'FY' },

    { name: 'Machine Learning Fundamentals', code: 'DS201', department: 'DS', class_year: 'SY' },
    { name: 'Statistical Inference', code: 'DS202', department: 'DS', class_year: 'SY' },
    { name: 'Big Data Technologies', code: 'DS203', department: 'DS', class_year: 'SY' },
    { name: 'Data Mining', code: 'DS204', department: 'DS', class_year: 'SY' },
    { name: 'R Programming', code: 'DS205', department: 'DS', class_year: 'SY' },
    { name: 'Deep Learning', code: 'DS206', department: 'DS', class_year: 'SY' },
    { name: 'Natural Language Processing', code: 'DS207', department: 'DS', class_year: 'SY' },
    { name: 'Time Series Analysis', code: 'DS208', department: 'DS', class_year: 'SY' },
    { name: 'Advanced Data Visualization', code: 'DS209', department: 'DS', class_year: 'SY' },
    { name: 'Data Engineering', code: 'DS210', department: 'DS', class_year: 'SY' },

    { name: 'Advanced Machine Learning', code: 'DS301', department: 'DS', class_year: 'TY' },
    { name: 'Computer Vision', code: 'DS302', department: 'DS', class_year: 'TY' },
    { name: 'Reinforcement Learning', code: 'DS303', department: 'DS', class_year: 'TY' },
    { name: 'Business Analytics', code: 'DS304', department: 'DS', class_year: 'TY' },
    { name: 'Cloud Data Platforms', code: 'DS305', department: 'DS', class_year: 'TY' },
    { name: 'MLOps and Deployment', code: 'DS306', department: 'DS', class_year: 'TY' },
    { name: 'Predictive Analytics', code: 'DS307', department: 'DS', class_year: 'TY' },
    { name: 'Big Data Analytics', code: 'DS308', department: 'DS', class_year: 'TY' },
    { name: 'AI Ethics', code: 'DS309', department: 'DS', class_year: 'TY' },
    { name: 'Capstone Project', code: 'DS310', department: 'DS', class_year: 'TY' }
];

// BMS Department
const bmsSubjects = [
    { name: 'Principles of Management', code: 'BMS101', department: 'BMS', class_year: 'FY' },
    { name: 'Business Communication', code: 'BMS102', department: 'BMS', class_year: 'FY' },
    { name: 'Business Economics I', code: 'BMS103', department: 'BMS', class_year: 'FY' },
    { name: 'Accounting for Managers', code: 'BMS104', department: 'BMS', class_year: 'FY' },
    { name: 'Business Mathematics', code: 'BMS105', department: 'BMS', class_year: 'FY' },
    { name: 'Organizational Behavior', code: 'BMS106', department: 'BMS', class_year: 'FY' },
    { name: 'Marketing Management', code: 'BMS107', department: 'BMS', class_year: 'FY' },
    { name: 'Business Economics II', code: 'BMS108', department: 'BMS', class_year: 'FY' },
    { name: 'Financial Accounting', code: 'BMS109', department: 'BMS', class_year: 'FY' },
    { name: 'Business Statistics', code: 'BMS110', department: 'BMS', class_year: 'FY' },

    { name: 'Human Resource Management', code: 'BMS201', department: 'BMS', class_year: 'SY' },
    { name: 'Financial Management', code: 'BMS202', department: 'BMS', class_year: 'SY' },
    { name: 'Operations Management', code: 'BMS203', department: 'BMS', class_year: 'SY' },
    { name: 'Business Law', code: 'BMS204', department: 'BMS', class_year: 'SY' },
    { name: 'Research Methodology', code: 'BMS205', department: 'BMS', class_year: 'SY' },
    { name: 'Strategic Management', code: 'BMS206', department: 'BMS', class_year: 'SY' },
    { name: 'International Business', code: 'BMS207', department: 'BMS', class_year: 'SY' },
    { name: 'Consumer Behavior', code: 'BMS208', department: 'BMS', class_year: 'SY' },
    { name: 'Management Information Systems', code: 'BMS209', department: 'BMS', class_year: 'SY' },
    { name: 'Corporate Finance', code: 'BMS210', department: 'BMS', class_year: 'SY' },

    { name: 'Entrepreneurship Development', code: 'BMS301', department: 'BMS', class_year: 'TY' },
    { name: 'Supply Chain Management', code: 'BMS302', department: 'BMS', class_year: 'TY' },
    { name: 'Business Analytics', code: 'BMS303', department: 'BMS', class_year: 'TY' },
    { name: 'Brand Management', code: 'BMS304', department: 'BMS', class_year: 'TY' },
    { name: 'Corporate Governance', code: 'BMS305', department: 'BMS', class_year: 'TY' },
    { name: 'Project Management', code: 'BMS306', department: 'BMS', class_year: 'TY' },
    { name: 'E-Commerce', code: 'BMS307', department: 'BMS', class_year: 'TY' },
    { name: 'Leadership Skills', code: 'BMS308', department: 'BMS', class_year: 'TY' },
    { name: 'Business Ethics', code: 'BMS309', department: 'BMS', class_year: 'TY' },
    { name: 'Management Project', code: 'BMS310', department: 'BMS', class_year: 'TY' }
];

// BAF Department
const bafSubjects = [
    { name: 'Financial Accounting I', code: 'BAF101', department: 'BAF', class_year: 'FY' },
    { name: 'Business Economics I', code: 'BAF102', department: 'BAF', class_year: 'FY' },
    { name: 'Business Mathematics', code: 'BAF103', department: 'BAF', class_year: 'FY' },
    { name: 'Communication Skills', code: 'BAF104', department: 'BAF', class_year: 'FY' },
    { name: 'Foundation Course', code: 'BAF105', department: 'BAF', class_year: 'FY' },
    { name: 'Financial Accounting II', code: 'BAF106', department: 'BAF', class_year: 'FY' },
    { name: 'Business Economics II', code: 'BAF107', department: 'BAF', class_year: 'FY' },
    { name: 'Business Statistics', code: 'BAF108', department: 'BAF', class_year: 'FY' },
    { name: 'Introduction to Banking', code: 'BAF109', department: 'BAF', class_year: 'FY' },
    { name: 'Business Law', code: 'BAF110', department: 'BAF', class_year: 'FY' },

    { name: 'Corporate Accounting', code: 'BAF201', department: 'BAF', class_year: 'SY' },
    { name: 'Cost Accounting', code: 'BAF202', department: 'BAF', class_year: 'SY' },
    { name: 'Corporate Finance', code: 'BAF203', department: 'BAF', class_year: 'SY' },
    { name: 'Banking Operations', code: 'BAF204', department: 'BAF', class_year: 'SY' },
    { name: 'Taxation I', code: 'BAF205', department: 'BAF', class_year: 'SY' },
    { name: 'Management Accounting', code: 'BAF206', department: 'BAF', class_year: 'SY' },
    { name: 'Financial Markets', code: 'BAF207', department: 'BAF', class_year: 'SY' },
    { name: 'Investment Management', code: 'BAF208', department: 'BAF', class_year: 'SY' },
    { name: 'Banking Law', code: 'BAF209', department: 'BAF', class_year: 'SY' },
    { name: 'Taxation II', code: 'BAF210', department: 'BAF', class_year: 'SY' },

    { name: 'Advanced Accounting', code: 'BAF301', department: 'BAF', class_year: 'TY' },
    { name: 'Auditing', code: 'BAF302', department: 'BAF', class_year: 'TY' },
    { name: 'Risk Management', code: 'BAF303', department: 'BAF', class_year: 'TY' },
    { name: 'International Finance', code: 'BAF304', department: 'BAF', class_year: 'TY' },
    { name: 'Financial Modeling', code: 'BAF305', department: 'BAF', class_year: 'TY' },
    { name: 'Strategic Financial Management', code: 'BAF306', department: 'BAF', class_year: 'TY' },
    { name: 'Portfolio Management', code: 'BAF307', department: 'BAF', class_year: 'TY' },
    { name: 'Financial Derivatives', code: 'BAF308', department: 'BAF', class_year: 'TY' },
    { name: 'Fintech and Digital Banking', code: 'BAF309', department: 'BAF', class_year: 'TY' },
    { name: 'Finance Project', code: 'BAF310', department: 'BAF', class_year: 'TY' }
];

// BAMMC Department
const bammcSubjects = [
    { name: 'Introduction to Mass Media', code: 'BMM101', department: 'BAMMC', class_year: 'FY' },
    { name: 'Communication Skills', code: 'BMM102', department: 'BAMMC', class_year: 'FY' },
    { name: 'Media Laws and Ethics', code: 'BMM103', department: 'BAMMC', class_year: 'FY' },
    { name: 'Foundation of Photography', code: 'BMM104', department: 'BAMMC', class_year: 'FY' },
    { name: 'History of Media', code: 'BMM105', department: 'BAMMC', class_year: 'FY' },
    { name: 'Journalism Fundamentals', code: 'BMM106', department: 'BAMMC', class_year: 'FY' },
    { name: 'Writing for Media', code: 'BMM107', department: 'BAMMC', class_year: 'FY' },
    { name: 'Visual Communication', code: 'BMM108', department: 'BAMMC', class_year: 'FY' },
    { name: 'Digital Media Basics', code: 'BMM109', department: 'BAMMC', class_year: 'FY' },
    { name: 'Media Research Methods', code: 'BMM110', department: 'BAMMC', class_year: 'FY' },

    { name: 'Print Journalism', code: 'BMM201', department: 'BAMMC', class_year: 'SY' },
    { name: 'Advertising Principles', code: 'BMM202', department: 'BAMMC', class_year: 'SY' },
    { name: 'Radio Production', code: 'BMM203', department: 'BAMMC', class_year: 'SY' },
    { name: 'Public Relations', code: 'BMM204', department: 'BAMMC', class_year: 'SY' },
    { name: 'Media Economics', code: 'BMM205', department: 'BAMMC', class_year: 'SY' },
    { name: 'Television Production', code: 'BMM206', department: 'BAMMC', class_year: 'SY' },
    { name: 'Event Management', code: 'BMM207', department: 'BAMMC', class_year: 'SY' },
    { name: 'Social Media Marketing', code: 'BMM208', department: 'BAMMC', class_year: 'SY' },
    { name: 'Content Creation', code: 'BMM209', department: 'BAMMC', class_year: 'SY' },
    { name: 'Film Studies', code: 'BMM210', department: 'BAMMC', class_year: 'SY' },

    { name: 'Digital Journalism', code: 'BMM301', department: 'BAMMC', class_year: 'TY' },
    { name: 'Brand Management', code: 'BMM302', department: 'BAMMC', class_year: 'TY' },
    { name: 'Documentary Production', code: 'BMM303', department: 'BAMMC', class_year: 'TY' },
    { name: 'Media Analytics', code: 'BMM304', department: 'BAMMC', class_year: 'TY' },
    { name: 'Corporate Communication', code: 'BMM305', department: 'BAMMC', class_year: 'TY' },
    { name: 'Multimedia Projects', code: 'BMM306', department: 'BAMMC', class_year: 'TY' },
    { name: 'Integrated Marketing Communication', code: 'BMM307', department: 'BAMMC', class_year: 'TY' },
    { name: 'Media Entrepreneurship', code: 'BMM308', department: 'BAMMC', class_year: 'TY' },
    { name: 'Global Media Trends', code: 'BMM309', department: 'BAMMC', class_year: 'TY' },
    { name: 'Final Media Project', code: 'BMM310', department: 'BAMMC', class_year: 'TY' }
];

// Combine all subjects
const allSubjects = [
    ...itSubjects,
    ...csSubjects,
    ...dsSubjects,
    ...bmsSubjects,
    ...bafSubjects,
    ...bammcSubjects
];

// Create workbook with correct headers
const wb = XLSX.utils.book_new();

// Main sheet with correct column names
const data = [
    ['Name', 'Code', 'Department', 'Class Year'], // Headers that match validation
    ...allSubjects.map(s => [s.name, s.code, s.department, s.class_year])
];

const ws = XLSX.utils.aoa_to_sheet(data);
ws['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, ws, 'Subjects');

// Individual department sheets
const depts = [
    { name: 'IT', subjects: itSubjects },
    { name: 'CS', subjects: csSubjects },
    { name: 'DS', subjects: dsSubjects },
    { name: 'BMS', subjects: bmsSubjects },
    { name: 'BAF', subjects: bafSubjects },
    { name: 'BAMMC', subjects: bammcSubjects }
];

depts.forEach(dept => {
    const deptData = [
        ['Name', 'Code', 'Class Year'],
        ...dept.subjects.map(s => [s.name, s.code, s.class_year])
    ];
    const deptWs = XLSX.utils.aoa_to_sheet(deptData);
    deptWs['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, deptWs, dept.name);
});

// Write file
const outputPath = path.join(__dirname, 'Subjects_Import_Ready.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Import-ready Excel file created!');
console.log(`📁 Location: ${outputPath}`);
console.log('');
console.log('📋 Format:');
console.log('  • Columns: Name, Code, Department, Class Year');
console.log('  • Total subjects: 180 (30 per department)');
console.log('  • Departments: IT, CS, DS, BMS, BAF, BAMMC');
console.log('');
console.log('✅ Ready to upload via Subject Management interface!');
