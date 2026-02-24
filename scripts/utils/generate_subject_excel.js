const XLSX = require('xlsx');
const path = require('path');

// Department configurations with proper curriculum
const departments = [
    {
        name: 'IT',
        fullName: 'Information Technology',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'IT101', name: 'Programming Fundamentals', credits: 4 },
                    { code: 'IT102', name: 'Digital Electronics', credits: 4 },
                    { code: 'IT103', name: 'Discrete Mathematics', credits: 3 },
                    { code: 'IT104', name: 'Communication Skills', credits: 2 },
                    { code: 'IT105', name: 'Environmental Studies', credits: 2 }
                ],
                'Semester 2': [
                    { code: 'IT106', name: 'Object Oriented Programming', credits: 4 },
                    { code: 'IT107', name: 'Data Structures', credits: 4 },
                    { code: 'IT108', name: 'Computer Organization', credits: 3 },
                    { code: 'IT109', name: 'Web Technologies', credits: 3 },
                    { code: 'IT110', name: 'Database Management Systems', credits: 4 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'IT201', name: 'Software Engineering', credits: 4 },
                    { code: 'IT202', name: 'Operating Systems', credits: 4 },
                    { code: 'IT203', name: 'Computer Networks', credits: 4 },
                    { code: 'IT204', name: 'Theory of Computation', credits: 3 },
                    { code: 'IT205', name: 'Python Programming', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'IT206', name: 'Advanced Java Programming', credits: 4 },
                    { code: 'IT207', name: 'Information Security', credits: 3 },
                    { code: 'IT208', name: 'Mobile Application Development', credits: 4 },
                    { code: 'IT209', name: 'Cloud Computing', credits: 3 },
                    { code: 'IT210', name: 'Data Analytics', credits: 4 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'IT301', name: 'Artificial Intelligence', credits: 4 },
                    { code: 'IT302', name: 'Machine Learning', credits: 4 },
                    { code: 'IT303', name: 'Big Data Analytics', credits: 4 },
                    { code: 'IT304', name: 'Internet of Things', credits: 3 },
                    { code: 'IT305', name: 'Blockchain Technology', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'IT306', name: 'DevOps and Automation', credits: 3 },
                    { code: 'IT307', name: 'Cyber Security', credits: 4 },
                    { code: 'IT308', name: 'Software Project Management', credits: 3 },
                    { code: 'IT309', name: 'Natural Language Processing', credits: 4 },
                    { code: 'IT310', name: 'Industry Project', credits: 6 }
                ]
            }
        }
    },
    {
        name: 'CS',
        fullName: 'Computer Science',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'CS101', name: 'Programming in C', credits: 4 },
                    { code: 'CS102', name: 'Digital Logic Design', credits: 4 },
                    { code: 'CS103', name: 'Mathematics I', credits: 4 },
                    { code: 'CS104', name: 'Technical Communication', credits: 2 },
                    { code: 'CS105', name: 'Physics for Computing', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'CS106', name: 'C++ Programming', credits: 4 },
                    { code: 'CS107', name: 'Data Structures & Algorithms', credits: 4 },
                    { code: 'CS108', name: 'Mathematics II', credits: 4 },
                    { code: 'CS109', name: 'Computer Architecture', credits: 3 },
                    { code: 'CS110', name: 'Database Concepts', credits: 4 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'CS201', name: 'Advanced Data Structures', credits: 4 },
                    { code: 'CS202', name: 'Operating System Concepts', credits: 4 },
                    { code: 'CS203', name: 'Computer Networks', credits: 4 },
                    { code: 'CS204', name: 'Microprocessors', credits: 3 },
                    { code: 'CS205', name: 'Discrete Mathematics', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'CS206', name: 'Design & Analysis of Algorithms', credits: 4 },
                    { code: 'CS207', name: 'Theory of Computation', credits: 3 },
                    { code: 'CS208', name: 'Compiler Design', credits: 4 },
                    { code: 'CS209', name: 'Software Engineering', credits: 4 },
                    { code: 'CS210', name: 'Java Programming', credits: 3 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'CS301', name: 'Artificial Intelligence', credits: 4 },
                    { code: 'CS302', name: 'Machine Learning', credits: 4 },
                    { code: 'CS303', name: 'Computer Graphics', credits: 4 },
                    { code: 'CS304', name: 'Distributed Systems', credits: 3 },
                    { code: 'CS305', name: 'Cryptography', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'CS306', name: 'Deep Learning', credits: 4 },
                    { code: 'CS307', name: 'Advanced Databases', credits: 4 },
                    { code: 'CS308', name: 'Cloud Computing Architecture', credits: 3 },
                    { code: 'CS309', name: 'Information Retrieval', credits: 3 },
                    { code: 'CS310', name: 'Final Year Project', credits: 6 }
                ]
            }
        }
    },
    {
        name: 'DS',
        fullName: 'Data Science',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'DS101', name: 'Introduction to Data Science', credits: 4 },
                    { code: 'DS102', name: 'Python Programming', credits: 4 },
                    { code: 'DS103', name: 'Statistics for Data Science', credits: 4 },
                    { code: 'DS104', name: 'Mathematics for Data Science', credits: 3 },
                    { code: 'DS105', name: 'Communication Skills', credits: 2 }
                ],
                'Semester 2': [
                    { code: 'DS106', name: 'Advanced Python', credits: 4 },
                    { code: 'DS107', name: 'Probability Theory', credits: 3 },
                    { code: 'DS108', name: 'Data Structures', credits: 4 },
                    { code: 'DS109', name: 'Database Systems', credits: 4 },
                    { code: 'DS110', name: 'Data Visualization', credits: 3 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'DS201', name: 'Machine Learning Fundamentals', credits: 4 },
                    { code: 'DS202', name: 'Statistical Inference', credits: 4 },
                    { code: 'DS203', name: 'Big Data Technologies', credits: 4 },
                    { code: 'DS204', name: 'Data Mining', credits: 3 },
                    { code: 'DS205', name: 'R Programming', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'DS206', name: 'Deep Learning', credits: 4 },
                    { code: 'DS207', name: 'Natural Language Processing', credits: 4 },
                    { code: 'DS208', name: 'Time Series Analysis', credits: 3 },
                    { code: 'DS209', name: 'Advanced Data Visualization', credits: 3 },
                    { code: 'DS210', name: 'Data Engineering', credits: 4 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'DS301', name: 'Advanced Machine Learning', credits: 4 },
                    { code: 'DS302', name: 'Computer Vision', credits: 4 },
                    { code: 'DS303', name: 'Reinforcement Learning', credits: 4 },
                    { code: 'DS304', name: 'Business Analytics', credits: 3 },
                    { code: 'DS305', name: 'Cloud Data Platforms', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'DS306', name: 'MLOps and Deployment', credits: 3 },
                    { code: 'DS307', name: 'Predictive Analytics', credits: 4 },
                    { code: 'DS308', name: 'Big Data Analytics', credits: 4 },
                    { code: 'DS309', name: 'AI Ethics', credits: 2 },
                    { code: 'DS310', name: 'Capstone Project', credits: 6 }
                ]
            }
        }
    },
    {
        name: 'BMS',
        fullName: 'Bachelor of Management Studies',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'BMS101', name: 'Principles of Management', credits: 4 },
                    { code: 'BMS102', name: 'Business Communication', credits: 3 },
                    { code: 'BMS103', name: 'Business Economics I', credits: 4 },
                    { code: 'BMS104', name: 'Accounting for Managers', credits: 4 },
                    { code: 'BMS105', name: 'Business Mathematics', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMS106', name: 'Organizational Behavior', credits: 4 },
                    { code: 'BMS107', name: 'Marketing Management', credits: 4 },
                    { code: 'BMS108', name: 'Business Economics II', credits: 4 },
                    { code: 'BMS109', name: 'Financial Accounting', credits: 4 },
                    { code: 'BMS110', name: 'Business Statistics', credits: 3 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'BMS201', name: 'Human Resource Management', credits: 4 },
                    { code: 'BMS202', name: 'Financial Management', credits: 4 },
                    { code: 'BMS203', name: 'Operations Management', credits: 4 },
                    { code: 'BMS204', name: 'Business Law', credits: 3 },
                    { code: 'BMS205', name: 'Research Methodology', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMS206', name: 'Strategic Management', credits: 4 },
                    { code: 'BMS207', name: 'International Business', credits: 4 },
                    { code: 'BMS208', name: 'Consumer Behavior', credits: 3 },
                    { code: 'BMS209', name: 'Management Information Systems', credits: 3 },
                    { code: 'BMS210', name: 'Corporate Finance', credits: 4 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'BMS301', name: 'Entrepreneurship Development', credits: 4 },
                    { code: 'BMS302', name: 'Supply Chain Management', credits: 4 },
                    { code: 'BMS303', name: 'Business Analytics', credits: 4 },
                    { code: 'BMS304', name: 'Brand Management', credits: 3 },
                    { code: 'BMS305', name: 'Corporate Governance', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMS306', name: 'Project Management', credits: 3 },
                    { code: 'BMS307', name: 'E-Commerce', credits: 3 },
                    { code: 'BMS308', name: 'Leadership Skills', credits: 3 },
                    { code: 'BMS309', name: 'Business Ethics', credits: 2 },
                    { code: 'BMS310', name: 'Management Project', credits: 6 }
                ]
            }
        }
    },
    {
        name: 'BAF',
        fullName: 'Banking and Finance',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'BAF101', name: 'Financial Accounting I', credits: 4 },
                    { code: 'BAF102', name: 'Business Economics I', credits: 4 },
                    { code: 'BAF103', name: 'Business Mathematics', credits: 3 },
                    { code: 'BAF104', name: 'Communication Skills', credits: 2 },
                    { code: 'BAF105', name: 'Foundation Course', credits: 2 }
                ],
                'Semester 2': [
                    { code: 'BAF106', name: 'Financial Accounting II', credits: 4 },
                    { code: 'BAF107', name: 'Business Economics II', credits: 4 },
                    { code: 'BAF108', name: 'Business Statistics', credits: 3 },
                    { code: 'BAF109', name: 'Introduction to Banking', credits: 4 },
                    { code: 'BAF110', name: 'Business Law', credits: 3 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'BAF201', name: 'Corporate Accounting', credits: 4 },
                    { code: 'BAF202', name: 'Cost Accounting', credits: 4 },
                    { code: 'BAF203', name: 'Corporate Finance', credits: 4 },
                    { code: 'BAF204', name: 'Banking Operations', credits: 3 },
                    { code: 'BAF205', name: 'Taxation I', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BAF206', name: 'Management Accounting', credits: 4 },
                    { code: 'BAF207', name: 'Financial Markets', credits: 4 },
                    { code: 'BAF208', name: 'Investment Management', credits: 4 },
                    { code: 'BAF209', name: 'Banking Law', credits: 3 },
                    { code: 'BAF210', name: 'Taxation II', credits: 3 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'BAF301', name: 'Advanced Accounting', credits: 4 },
                    { code: 'BAF302', name: 'Auditing', credits: 4 },
                    { code: 'BAF303', name: 'Risk Management', credits: 4 },
                    { code: 'BAF304', name: 'International Finance', credits: 3 },
                    { code: 'BAF305', name: 'Financial Modeling', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BAF306', name: 'Strategic Financial Management', credits: 4 },
                    { code: 'BAF307', name: 'Portfolio Management', credits: 4 },
                    { code: 'BAF308', name: 'Financial Derivatives', credits: 4 },
                    { code: 'BAF309', name: 'Fintech and Digital Banking', credits: 3 },
                    { code: 'BAF310', name: 'Finance Project', credits: 6 }
                ]
            }
        }
    },
    {
        name: 'BAMMC',
        fullName: 'Mass Media and Communication',
        subjects: {
            FY: {
                'Semester 1': [
                    { code: 'BMM101', name: 'Introduction to Mass Media', credits: 4 },
                    { code: 'BMM102', name: 'Communication Skills', credits: 3 },
                    { code: 'BMM103', name: 'Media Laws and Ethics', credits: 3 },
                    { code: 'BMM104', name: 'Foundation of Photography', credits: 4 },
                    { code: 'BMM105', name: 'History of Media', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMM106', name: 'Journalism Fundamentals', credits: 4 },
                    { code: 'BMM107', name: 'Writing for Media', credits: 4 },
                    { code: 'BMM108', name: 'Visual Communication', credits: 3 },
                    { code: 'BMM109', name: 'Digital Media Basics', credits: 4 },
                    { code: 'BMM110', name: 'Media Research Methods', credits: 3 }
                ]
            },
            SY: {
                'Semester 1': [
                    { code: 'BMM201', name: 'Print Journalism', credits: 4 },
                    { code: 'BMM202', name: 'Advertising Principles', credits: 4 },
                    { code: 'BMM203', name: 'Radio Production', credits: 4 },
                    { code: 'BMM204', name: 'Public Relations', credits: 3 },
                    { code: 'BMM205', name: 'Media Economics', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMM206', name: 'Television Production', credits: 4 },
                    { code: 'BMM207', name: 'Event Management', credits: 3 },
                    { code: 'BMM208', name: 'Social Media Marketing', credits: 4 },
                    { code: 'BMM209', name: 'Content Creation', credits: 4 },
                    { code: 'BMM210', name: 'Film Studies', credits: 3 }
                ]
            },
            TY: {
                'Semester 1': [
                    { code: 'BMM301', name: 'Digital Journalism', credits: 4 },
                    { code: 'BMM302', name: 'Brand Management', credits: 4 },
                    { code: 'BMM303', name: 'Documentary Production', credits: 4 },
                    { code: 'BMM304', name: 'Media Analytics', credits: 3 },
                    { code: 'BMM305', name: 'Corporate Communication', credits: 3 }
                ],
                'Semester 2': [
                    { code: 'BMM306', name: 'Multimedia Projects', credits: 4 },
                    { code: 'BMM307', name: 'Integrated Marketing Communication', credits: 4 },
                    { code: 'BMM308', name: 'Media Entrepreneurship', credits: 3 },
                    { code: 'BMM309', name: 'Global Media Trends', credits: 3 },
                    { code: 'BMM310', name: 'Final Media Project', credits: 6 }
                ]
            }
        }
    }
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create master sheet with all data
const masterData = [];
masterData.push(['Department', 'Department Full Name', 'Academic Year', 'Semester', 'Subject Code', 'Subject Name', 'Credits']);

departments.forEach(dept => {
    ['FY', 'SY', 'TY'].forEach(year => {
        ['Semester 1', 'Semester 2'].forEach(semester => {
            dept.subjects[year][semester].forEach(subject => {
                masterData.push([
                    dept.name,
                    dept.fullName,
                    year === 'FY' ? 'First Year' : year === 'SY' ? 'Second Year' : 'Third Year',
                    semester,
                    subject.code,
                    subject.name,
                    subject.credits
                ]);
            });
        });
    });
});

const masterSheet = XLSX.utils.aoa_to_sheet(masterData);

// Set column widths
masterSheet['!cols'] = [
    { wch: 12 },  // Department
    { wch: 35 },  // Department Full Name
    { wch: 15 },  // Academic Year
    { wch: 12 },  // Semester
    { wch: 15 },  // Subject Code
    { wch: 45 },  // Subject Name
    { wch: 10 }   // Credits
];

XLSX.utils.book_append_sheet(wb, masterSheet, 'All Departments');

// Create individual department sheets
departments.forEach(dept => {
    const deptData = [];
    deptData.push(['Academic Year', 'Semester', 'Subject Code', 'Subject Name', 'Credits']);

    ['FY', 'SY', 'TY'].forEach(year => {
        ['Semester 1', 'Semester 2'].forEach(semester => {
            dept.subjects[year][semester].forEach(subject => {
                deptData.push([
                    year === 'FY' ? 'First Year' : year === 'SY' ? 'Second Year' : 'Third Year',
                    semester,
                    subject.code,
                    subject.name,
                    subject.credits
                ]);
            });
        });
    });

    const deptSheet = XLSX.utils.aoa_to_sheet(deptData);

    // Set column widths for department sheets
    deptSheet['!cols'] = [
        { wch: 15 },  // Academic Year
        { wch: 12 },  // Semester
        { wch: 15 },  // Subject Code
        { wch: 45 },  // Subject Name
        { wch: 10 }   // Credits
    ];

    XLSX.utils.book_append_sheet(wb, deptSheet, dept.name);
});

// Create summary sheet
const summaryData = [];
summaryData.push(['Summary Report']);
summaryData.push(['']);
summaryData.push(['Department', 'Total Subjects', 'FY Subjects', 'SY Subjects', 'TY Subjects']);

departments.forEach(dept => {
    const fyCount = dept.subjects.FY['Semester 1'].length + dept.subjects.FY['Semester 2'].length;
    const syCount = dept.subjects.SY['Semester 1'].length + dept.subjects.SY['Semester 2'].length;
    const tyCount = dept.subjects.TY['Semester 1'].length + dept.subjects.TY['Semester 2'].length;

    summaryData.push([
        `${dept.name} - ${dept.fullName}`,
        fyCount + syCount + tyCount,
        fyCount,
        syCount,
        tyCount
    ]);
});

summaryData.push(['']);
summaryData.push(['Total Departments', departments.length]);
summaryData.push(['Total Subjects', departments.length * 30]);
summaryData.push(['']);
summaryData.push(['Structure']);
summaryData.push(['Academic Years per Department', 3]);
summaryData.push(['Semesters per Year', 2]);
summaryData.push(['Subjects per Semester', 5]);
summaryData.push(['Subjects per Year', 10]);
summaryData.push(['Subjects per Department', 30]);

const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
summarySheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

// Write file
const outputPath = path.join(__dirname, 'Department_Subjects_Comprehensive.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Excel file created successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('');
console.log('📊 File Structure:');
console.log('  • Sheet 1: Summary - Overview of all departments');
console.log('  • Sheet 2: All Departments - Complete dataset');
console.log('  • Sheets 3-8: Individual department sheets (IT, CS, DS, BMS, BAF, BAMMC)');
console.log('');
console.log('📈 Data Summary:');
console.log(`  • Total Departments: ${departments.length}`);
console.log(`  • Total Subjects: ${departments.length * 30}`);
console.log('  • Structure: 3 Years × 2 Semesters × 5 Subjects = 30 subjects per department');
