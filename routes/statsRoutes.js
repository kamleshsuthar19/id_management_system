// routes/statsRoutes.js

const express = require('express');
const router = express.Router();
const getSummaryStats = require('../controllers/statsController');

// ID Dashboard Home
router.get('/summary-stats', getSummaryStats);

module.exports = router;