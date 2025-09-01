// controller/statsController.js

const db = require('../config/db'); // mysql2 pool/connection

const getSummaryStats = async (req, res) => {
  try {
    // Count all workers
    const [workersCount] = await db.query("SELECT COUNT(*) AS totalWorkers FROM information");

    // Count IDs generated today
    const [idsRows] = await db.query(`
      SELECT COUNT(*) AS idsGeneratedToday 
      FROM information 
      WHERE DATE(created_at) = CURDATE()
    `);

    res.json({
      totalWorkers: workersCount[0].totalWorkers,
      idsGeneratedToday: idsRows[0].idsGeneratedToday
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch summary statistics" });
  }
};

module.exports = getSummaryStats;