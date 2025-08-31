// routes/departmentBreakDownRoutes.js

const express = require('express');
const router = express.Router();
const getDepartmentBreakdown = require('../controllers/departmentBreakDownController');

// ID Dashboard Home
router.get('/department-breakdown', getDepartmentBreakdown);

module.exports = router;