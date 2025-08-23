// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// ID Dashboard Home
router.get('/', (req, res) => {
  res.render('id-dashboard');
});

// Get all workers
router.get("/records", dashboardController.getWorkers);

// Get single worker by ID
router.get("/records/:id", dashboardController.getWorkerById);

// Delete worker
router.delete("/records/:id", dashboardController.deleteWorker);

// Update worker
router.put("/records/:id", dashboardController.updateWorker);

module.exports = router;