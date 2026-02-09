const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');

/**
 * Export Service - Handles data export in multiple formats
 * Supports CSV, Excel (XLSX), and PDF exports
 */

/**
 * Convert JSON array to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} columns - Optional column definitions [{key, header}]
 * @returns {string} CSV formatted string
 */
const jsonToCSV = (data, columns = null) => {
    if (!data || data.length === 0) return '';

    // Auto-detect columns if not provided
    const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }));

    // Build header row
    const headers = cols.map(col => `"${col.header}"`).join(',');

    // Build data rows
    const rows = data.map(row => {
        return cols.map(col => {
            const value = row[col.key];
            // Handle null/undefined
            if (value == null) return '""';
            // Escape quotes and wrap in quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headers, ...rows].join('\n');
};

/**
 * Convert JSON array to Excel workbook buffer
 * @param {Array} data - Array of objects
 * @param {string} sheetName - Name for the worksheet
 * @param {Array} columns - Optional column definitions
 * @returns {Buffer} Excel file buffer
 */
const jsonToExcel = (data, sheetName = 'Report', columns = null) => {
    // Prepare data with custom column headers if provided
    let worksheetData = data;

    if (columns && data.length > 0) {
        // Map data to use custom headers
        worksheetData = data.map(row => {
            const newRow = {};
            columns.forEach(col => {
                newRow[col.header] = row[col.key];
            });
            return newRow;
        });
    }

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Generate PDF report from data
 * @param {Array} data - Array of objects
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDF = (data, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: options.size || 'A4',
                ...options.pdfOptions
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Add title
            if (options.title) {
                doc.fontSize(20).font('Helvetica-Bold').text(options.title, { align: 'center' });
                doc.moveDown();
            }

            // Add subtitle/date
            if (options.subtitle) {
                doc.fontSize(12).font('Helvetica').text(options.subtitle, { align: 'center' });
                doc.moveDown();
            }

            // Add metadata
            if (options.metadata) {
                doc.fontSize(10).font('Helvetica');
                Object.entries(options.metadata).forEach(([key, value]) => {
                    doc.text(`${key}: ${value}`);
                });
                doc.moveDown();
            }

            // Add table if data provided
            if (data && data.length > 0) {
                const columns = options.columns || Object.keys(data[0]).map(k => ({ key: k, header: k }));

                // Table styling
                const tableTop = doc.y;
                const itemHeight = 25;
                const tableWidth = 500;
                const colWidth = tableWidth / columns.length;

                // Draw header
                doc.font('Helvetica-Bold').fontSize(10);
                columns.forEach((col, i) => {
                    doc.text(col.header, 50 + (i * colWidth), tableTop, {
                        width: colWidth,
                        align: 'left'
                    });
                });

                // Draw header line
                doc.moveTo(50, tableTop + 15)
                    .lineTo(50 + tableWidth, tableTop + 15)
                    .stroke();

                // Draw rows
                doc.font('Helvetica').fontSize(9);
                let currentY = tableTop + itemHeight;

                data.forEach((row, rowIndex) => {
                    // Check if new page needed
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }

                    columns.forEach((col, colIndex) => {
                        const value = row[col.key] != null ? String(row[col.key]) : '';
                        doc.text(value, 50 + (colIndex * colWidth), currentY, {
                            width: colWidth - 5,
                            align: 'left',
                            ellipsis: true
                        });
                    });

                    currentY += itemHeight;
                });
            }

            // Add footer with page numbers
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).text(
                    `Page ${i + 1} of ${pages.count}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Format data for export based on format type
 * @param {Array} data - Data to export
 * @param {string} format - Export format (csv, excel, pdf)
 * @param {Object} options - Format-specific options
 * @returns {Promise<{buffer: Buffer, contentType: string, filename: string}>}
 */
const exportData = async (data, format, options = {}) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const basename = options.filename || 'report';

    switch (format.toLowerCase()) {
        case 'csv':
            return {
                buffer: Buffer.from(jsonToCSV(data, options.columns)),
                contentType: 'text/csv',
                filename: `${basename}_${timestamp}.csv`
            };

        case 'excel':
        case 'xlsx':
            return {
                buffer: jsonToExcel(data, options.sheetName, options.columns),
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename: `${basename}_${timestamp}.xlsx`
            };

        case 'pdf':
            return {
                buffer: await generatePDF(data, options),
                contentType: 'application/pdf',
                filename: `${basename}_${timestamp}.pdf`
            };

        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
};

module.exports = {
    jsonToCSV,
    jsonToExcel,
    generatePDF,
    exportData
};
