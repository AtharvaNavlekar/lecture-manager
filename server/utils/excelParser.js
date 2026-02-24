// Excel parsing utility for bulk imports using ExcelJS
const ExcelJS = require('exceljs');

/**
 * Parse Excel file to JSON
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {Object} options - Parsing options
 * @returns {Array} Parsed rows
 */
/**
 * Parse Excel file to JSON (Supports Multi-Sheet)
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {Object} options - Parsing options
 * @returns {Array} Parsed rows (Flattened from all sheets)
 */
const parseExcel = async (fileBuffer, options = {}) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);

        const data = [];

        const parseSheet = (worksheet) => {
            if (!worksheet) return;
            const headers = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    // First row is headers
                    row.eachCell((cell) => {
                        headers.push(cell.value?.toString().trim() || '');
                    });
                } else {
                    const rowData = {};
                    // Track if row has any data to avoid empty rows
                    let hasData = false;

                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber - 1];
                        if (!header) return; // Skip if no header for this column

                        let value = cell.value;

                        // Handle Rich Text
                        if (value && typeof value === 'object' && value.richText) {
                            value = value.richText.map(r => r.text).join('');
                        }
                        // Handle Hyperlinks
                        if (value && typeof value === 'object' && value.text && value.hyperlink) {
                            value = value.text;
                        }

                        // Format Dates and Times
                        if (value instanceof Date) {
                            if (header.toLowerCase().includes('date')) {
                                const year = value.getFullYear();
                                const month = String(value.getMonth() + 1).padStart(2, '0');
                                const day = String(value.getDate()).padStart(2, '0');
                                value = `${year}-${month}-${day}`;
                            } else if (header.toLowerCase().includes('time')) {
                                const hours = String(value.getHours()).padStart(2, '0');
                                const minutes = String(value.getMinutes()).padStart(2, '0');
                                value = `${hours}:${minutes}`;
                            } else {
                                value = value.toString();
                            }
                        } else if (typeof value === 'number') {
                            if (header.toLowerCase().includes('date')) {
                                const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                value = `${year}-${month}-${day}`;
                            } else if (header.toLowerCase().includes('time')) {
                                const totalSeconds = Math.round(value * 86400);
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            }
                        }

                        if (value !== null && value !== undefined && value !== '') {
                            rowData[header] = value.toString().trim();
                            hasData = true;
                        } else {
                            rowData[header] = '';
                        }
                    });

                    if (hasData) data.push(rowData);
                }
            });
        };

        if (options.sheetName) {
            parseSheet(workbook.getWorksheet(options.sheetName));
        } else {
            workbook.eachSheet((worksheet) => {
                parseSheet(worksheet);
            });
        }

        console.log(`📊 Parsed ${data.length} rows from ${workbook.worksheets.length} sheets`);
        return data;

    } catch (error) {
        console.error('❌ Excel parsing error:', error);
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
};

/**
 * Validate teacher import data
 * @param {Array} rows - Parsed Excel rows
 * @returns {Object} Validation results
 */
const validateTeacherData = async (rows) => {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return {
            validRows: [],
            errors: [{ row: 0, errors: ['No data found in file. Please check if the Excel file has data rows.'], data: null }],
            total: 0
        };
    }

    const { validateDepartmentCode, getValidDepartments } = require('./departmentValidator');
    const errors = [];
    const validRows = [];

    // Fetch valid departments once for all rows
    let validDepts = [];
    try {
        validDepts = await getValidDepartments();
        if (!validDepts || validDepts.length === 0) {
            console.warn('⚠️ No active departments found in database. Skipping department validation.');
        }
    } catch (err) {
        console.error('❌ Failed to fetch departments:', err.message);
        // Continue without department validation
    }

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNum = index + 2; // Excel row (1-indexed + header)
        const rowErrors = [];

        // Required fields
        if (!row.name || row.name.trim() === '') {
            rowErrors.push('Name is required');
        }
        if (!row.email || row.email.trim() === '') {
            rowErrors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            rowErrors.push('Invalid email format');
        }
        if (!row.department) {
            rowErrors.push('Department is required');
        } else if (validDepts.length > 0) {
            // Validate department code only if we have valid departments
            const deptValidation = await validateDepartmentCode(row.department, validDepts);
            if (!deptValidation.valid) {
                if (deptValidation.suggestion) {
                    rowErrors.push(`${deptValidation.message} Use '${deptValidation.suggestion}' instead`);
                } else {
                    rowErrors.push(deptValidation.message);
                }
            }
        }

        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, errors: rowErrors, data: row });
        } else {
            validRows.push({
                name: row.name.trim(),
                email: row.email.trim().toLowerCase(),
                department: row.department.trim(),
                post: row.post || 'Assistant Professor',
                is_hod: row.is_hod === 'YES' || row.is_hod === '1' || row.is_hod === true,
                password: row.password || '' // Will use ID as default
            });
        }
    }

    return { validRows, errors, total: rows.length };
};

/**
 * Validate student import data
 * @param {Array} rows - Parsed Excel rows
 * @returns {Object} Validation results
 */
const validateStudentData = async (rows) => {
    const { validateDepartmentCode, getValidDepartments } = require('./departmentValidator');
    const errors = [];
    const validRows = [];

    // Fetch valid departments once for all rows
    const validDepts = await getValidDepartments();

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNum = index + 2;
        const rowErrors = [];

        // Required fields
        if (!row.name || row.name.trim() === '') {
            rowErrors.push('Name is required');
        }
        if (!row.roll_no && !row.RollNo) {
            rowErrors.push('Roll number is required');
        }
        if (!row.class_year && !row.ClassYear) {
            rowErrors.push('Class year is required');
        }

        // Validate department if provided
        let cleanDept = (row.department || row.Department || 'CS').trim();
        if (cleanDept) {
            const deptValidation = await validateDepartmentCode(cleanDept, validDepts);
            if (!deptValidation.valid) {
                if (deptValidation.suggestion) {
                    // Auto-fix: Use suggestion
                    cleanDept = deptValidation.suggestion;
                } else {
                    rowErrors.push(deptValidation.message);
                }
            }
        }

        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, errors: rowErrors, data: row });
        } else {
            validRows.push({
                name: row.name.trim(),
                roll_no: (row.roll_no || row.RollNo).toString().trim(),
                class_year: (row.class_year || row.ClassYear),
                email: (row.email || row.Email || '').trim(),
                department: cleanDept
            });
        }
    }

    return { validRows, errors, total: rows.length };
};

const validateSubjectData = async (rows) => {
    const { validateDepartmentCode, getValidDepartments } = require('./departmentValidator');
    const errors = [];
    const validRows = [];

    // Fetch valid departments once for all rows
    const validDepts = await getValidDepartments();

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNum = index + 2;
        const rowErrors = [];

        // Support multiple header formats
        const name = row.name || row.Name || row['Subject Name'] || row['subject name'];
        const code = row.code || row.Code || row['Subject Code'] || row['subject code'];
        const classYear = row.class_year || row.ClassYear || row['Class Year'] || row['class year'];
        const department = row.department || row.Department;

        if (!name) rowErrors.push('Name is required');
        if (!code) rowErrors.push('Code is required');
        if (!classYear) rowErrors.push('Class Year is required');

        // Validate department if provided
        let cleanDept = (department || 'CS').trim();
        if (department) {
            const deptValidation = await validateDepartmentCode(department, validDepts);
            if (!deptValidation.valid) {
                if (deptValidation.suggestion) {
                    // Auto-fix: Use suggestion
                    cleanDept = deptValidation.suggestion;
                } else {
                    rowErrors.push(deptValidation.message);
                }
            }
        }

        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, errors: rowErrors, data: row });
        } else {
            validRows.push({
                name: name.toString().trim(),
                code: code.toString().trim(),
                department: cleanDept,
                class_year: classYear.toString().trim()
            });
        }
    }

    return { validRows, errors, total: rows.length };
};

const validateLectureData = (rows) => {
    const errors = [];
    const validRows = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rowErrors = [];

        // For recurring schedules, day_of_week can replace date
        const hasDate = row.date || row.Date;
        const hasDayOfWeek = row.day_of_week || row.DayOfWeek || row['Day of Week'];

        if (!hasDate && !hasDayOfWeek) {
            rowErrors.push('Either Date or Day of Week is required');
        }
        if (!row.start_time && !row.StartTime) rowErrors.push('Start Time is required');
        if (!row.end_time && !row.EndTime) rowErrors.push('End Time is required');
        if (!row.subject && !row.Subject) rowErrors.push('Subject is required');
        if (!row.teacher_email && !row.TeacherEmail) rowErrors.push('Teacher Email is required');
        if (!row.class_year && !row.ClassYear) rowErrors.push('Class Year is required');

        if (rowErrors.length > 0) {
            console.log(`❌ Row ${rowNum} validation failed:`, rowErrors);
            console.log('Row data:', JSON.stringify(row, null, 2));
            errors.push({ row: rowNum, errors: rowErrors, data: row });
        } else {
            validRows.push({
                date: row.date || row.Date || null,
                day_of_week: row.day_of_week || row.DayOfWeek || row['Day of Week'] || null,
                start_time: row.start_time || row.StartTime,
                end_time: row.end_time || row.EndTime,
                subject: (row.subject || row.Subject).trim(),
                teacher_email: (row.teacher_email || row.TeacherEmail).trim(),
                class_year: (row.class_year || row.ClassYear).trim(),
                division: (row.division || row.Division || 'A').trim(),
                room: (row.room || row.Room || 'TBA').toString()
            });
        }
    });

    console.log(`✅ Validation complete: ${validRows.length} valid, ${errors.length} errors`);
    return { validRows, errors, total: rows.length };
};


/**
 * Validate syllabus import data
 * @param {Array} rows - Parsed Excel rows
 * @returns {Object} Validation results
 */
const validateSyllabusData = (rows) => {
    const errors = [];
    const validRows = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rowErrors = [];

        // Support multiple header formats
        const subjectCode = row.subject_code || row.SubjectCode || row['Subject Code'] || row['subject code'];
        const topicTitle = row.topic_title || row.TopicTitle || row['Topic Title'] || row['topic title'];
        const unitNumber = row.unit_number || row.UnitNumber || row['Unit Number'] || row['unit number'];
        const estimatedHours = row.estimated_hours || row.EstimatedHours || row['Estimated Hours'] || row['estimated hours'];

        if (!subjectCode) rowErrors.push('Subject Code is required');
        if (!topicTitle) rowErrors.push('Topic Title is required');

        // Ensure unit number is numeric
        const unit = parseInt(unitNumber);
        if (isNaN(unit)) rowErrors.push('Unit Number must be a number');

        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, errors: rowErrors, data: row });
        } else {
            validRows.push({
                subject_code: subjectCode.toString().trim(),
                unit_number: unit,
                topic_title: topicTitle.toString().trim(),
                estimated_hours: parseInt(estimatedHours || 1)
            });
        }
    });

    return { validRows, errors, total: rows.length };
};

/**
 * Generate Excel template
 * @param {String} type - 'teacher' or 'student'
 * @returns {Buffer} Excel file buffer
 */
const generateTemplate = async (type) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
        type.charAt(0).toUpperCase() + type.slice(1) + 's'
    );

    if (type === 'teacher') {
        // Define columns
        worksheet.columns = [
            { header: 'name', key: 'name', width: 20 },
            { header: 'email', key: 'email', width: 30 },
            { header: 'department', key: 'department', width: 15 },
            { header: 'post', key: 'post', width: 25 },
            { header: 'is_hod', key: 'is_hod', width: 10 }
        ];

        // Add sample data
        worksheet.addRows([
            {
                name: 'John Doe',
                email: 'john.doe@university.edu',
                department: 'CS',
                post: 'Assistant Professor',
                is_hod: 'NO'
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@university.edu',
                department: 'EE',
                post: 'Professor',
                is_hod: 'YES'
            }
        ]);
    } else if (type === 'subject') {
        worksheet.columns = [
            { header: 'name', key: 'name', width: 30 },
            { header: 'code', key: 'code', width: 15 },
            { header: 'department', key: 'department', width: 15 },
            { header: 'class_year', key: 'class_year', width: 15 }
        ];
        worksheet.addRows([
            { name: 'Data Structures', code: 'CS-201', department: 'CS', class_year: 'SY' },
            { name: 'Circuit Theory', code: 'EE-201', department: 'EE', class_year: 'SY' }
        ]);
    } else if (type === 'syllabus') {
        worksheet.columns = [
            { header: 'subject_code', key: 'subject_code', width: 15 },
            { header: 'unit_number', key: 'unit_number', width: 10 },
            { header: 'topic_title', key: 'topic_title', width: 40 },
            { header: 'estimated_hours', key: 'estimated_hours', width: 15 }
        ];
        worksheet.addRows([
            { subject_code: 'CS-201', unit_number: 1, topic_title: 'Introduction to Arrays', estimated_hours: 4 }
        ]);
    } else if (type === 'lecture') {

        worksheet.columns = [
            { header: 'date', key: 'date', width: 15 },
            { header: 'start_time', key: 'start_time', width: 15 },
            { header: 'end_time', key: 'end_time', width: 15 },
            { header: 'subject', key: 'subject', width: 25 },
            { header: 'teacher_email', key: 'teacher_email', width: 30 },
            { header: 'class_year', key: 'class_year', width: 15 },
            { header: 'room', key: 'room', width: 10 }
        ];
        worksheet.addRows([
            {
                date: '2025-10-15',
                start_time: '09:00',
                end_time: '10:00',
                subject: 'Data Structures',
                teacher_email: 'john.doe@university.edu',
                class_year: 'SY',
                room: '101'
            }
        ]);
    }

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    return await workbook.xlsx.writeBuffer();
};

module.exports = {
    parseExcel,
    validateTeacherData,
    validateStudentData,
    validateSubjectData,
    validateSyllabusData,
    validateLectureData,
    generateTemplate
};
