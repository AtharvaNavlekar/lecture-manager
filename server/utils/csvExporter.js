// CSV Export utility
const { stringify } = require('csv-stringify/sync');

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Field definitions
 * @returns {String} CSV string
 */
const exportToCSV = (data, fields) => {
    try {
        const processedData = data.map(row => {
            const newRow = {};
            fields.forEach(f => {
                if (typeof f.value === 'function') {
                    newRow[f.label] = f.value(row);
                } else {
                    newRow[f.label] = row[f.value];
                }
            });
            return newRow;
        });

        const csv = stringify(processedData, { header: true });

        console.log(`📊 Exported ${data.length} rows to CSV`);
        return csv;

    } catch (error) {
        console.error('❌ CSV export error:', error);
        throw new Error(`Failed to export CSV: ${error.message}`);
    }
};

/**
 * Export teachers to CSV
 * @param {Array} teachers - Teacher data
 * @returns {String} CSV string
 */
const exportTeachersCSV = (teachers) => {
    const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Department', value: 'department' },
        { label: 'Position', value: 'post' },
        { label: 'Is HOD', value: (row) => row.is_hod ? 'YES' : 'NO' },
        { label: 'Is Acting HOD', value: (row) => row.is_acting_hod ? 'YES' : 'NO' }
    ];

    return exportToCSV(teachers, fields);
};

/**
 * Export students to CSV
 * @param {Array} students - Student data
 * @returns {String} CSV string
 */
const exportStudentsCSV = (students) => {
    const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Roll Number', value: 'roll_no' },
        { label: 'Email', value: 'email' },
        { label: 'Department', value: 'department' },
        { label: 'Class Year', value: 'class_year' }
    ];

    return exportToCSV(students, fields);
};

/**
 * Export lectures to CSV
 * @param {Array} lectures - Lecture data
 * @returns {String} CSV string
 */
const exportLecturesCSV = (lectures) => {
    const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Subject', value: 'subject' },
        { label: 'Class Year', value: 'class_year' },
        { label: 'Teacher', value: 'teacher_name' },
        { label: 'Date', value: 'date' },
        { label: 'Start Time', value: 'start_time' },
        { label: 'End Time', value: 'end_time' },
        { label: 'Room', value: 'room' },
        { label: 'Status', value: 'status' },
        { label: 'Total Students', value: 'total_students' },
        { label: 'Present', value: 'attendance_count' }
    ];

    return exportToCSV(lectures, fields);
};

module.exports = {
    exportToCSV,
    exportTeachersCSV,
    exportStudentsCSV,
    exportLecturesCSV
};
