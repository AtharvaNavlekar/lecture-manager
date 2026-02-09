const express = require('express');
const router = express.Router();
const {
    assignSubstitute,
    getTeachersOnLeave,
    getLecturesNeedingSubstitutes
} = require('../controllers/substituteController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

router.post('/assign', assignSubstitute);
router.get('/teachers-on-leave', getTeachersOnLeave);
router.get('/lectures-needing-subs', getLecturesNeedingSubstitutes);

module.exports = router;
