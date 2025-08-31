// controllers/departmentBreakDownController.js

const db = require('../config/db'); // mysql2 pool/connection

const getDepartmentBreakdown = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT department, COUNT(*) as count
      FROM information
      GROUP BY department
    `);

    // Calculate total workers for percentage
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    // Add percentage for each department
    const breakdown = rows.map(row => ({
      department: row.department || "Unknown",
      count: row.count,
      percentage: ((row.count / total) * 100).toFixed(2)
    }));

    res.json(breakdown);
  } catch (err) {
    console.error("Error fetching department breakdown:", err);
    res.status(500).json({ error: "Failed to fetch department breakdown" });
  }
};

module.exports = getDepartmentBreakdown;