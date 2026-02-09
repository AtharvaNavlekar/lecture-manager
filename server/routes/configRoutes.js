const express = require('express');
const router = express.Router();
const { validateConfig } = require('../middleware/validation');

const {
    departmentsController,
    academicYearsController,
    timeSlotsController,
    divisionsController,
    roomsController,
    designationsController,
    systemConfigController
} = require('../controllers/configController');
const {
    auditConfigChanges,
    getAuditLogs,
    getTemplates,
    applyTemplate,
    bulkExport,
    bulkImport
} = require('../controllers/advancedConfigController');

// Departments Routes
router.get('/departments', departmentsController.getAll);
router.get('/departments/:id', departmentsController.getById);
router.post('/departments', departmentsController.create);
router.put('/departments/:id', departmentsController.update);
router.delete('/departments/:id', departmentsController.delete);

// Academic Years Routes
router.get('/academic-years', academicYearsController.getAll);
router.get('/academic-years/:id', academicYearsController.getById);
router.post('/academic-years', academicYearsController.create);
router.put('/academic-years/:id', academicYearsController.update);
router.delete('/academic-years/:id', academicYearsController.delete);

// Time Slots Routes
router.get('/time-slots', timeSlotsController.getAll);
router.get('/time-slots/:id', timeSlotsController.getById);
router.post('/time-slots', timeSlotsController.create);
router.put('/time-slots/:id', timeSlotsController.update);
router.delete('/time-slots/:id', timeSlotsController.delete);

// Divisions Routes
router.get('/divisions', divisionsController.getAll);
router.get('/divisions/:id', divisionsController.getById);
router.post('/divisions', divisionsController.create);
router.put('/divisions/:id', divisionsController.update);
router.delete('/divisions/:id', divisionsController.delete);

// Rooms Routes
router.get('/rooms', roomsController.getAll);
router.get('/rooms/:id', roomsController.getById);
router.post('/rooms', roomsController.create);
router.put('/rooms/:id', roomsController.update);
router.delete('/rooms/:id', roomsController.delete);

// Designations Routes
router.get('/designations', designationsController.getAll);
router.get('/designations/:id', designationsController.getById);
router.post('/designations', designationsController.create);
router.put('/designations/:id', designationsController.update);
router.delete('/designations/:id', designationsController.delete);

// System Config Routes
router.get('/system-config', systemConfigController.getAll);
router.get('/system-config/:key', systemConfigController.getByKey);
router.put('/system-config/:key', systemConfigController.update);

// Advanced Features Routes
// Audit Logs
router.get('/audit-logs', getAuditLogs);

// Templates
router.get('/templates', getTemplates);
router.post('/templates/:id/apply', applyTemplate);

// Bulk Operations
router.get('/export/:type', bulkExport);
router.post('/import/:type', bulkImport);

module.exports = router;
