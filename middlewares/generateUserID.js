// helpers/generateUserID.js
const db = require('../config/db');

const generateUserID = async (req, res, next) => {
  try {
    // Get the last userID, ordered by numeric part after JRCW
    const [rows] = await db.query(`
      SELECT userID 
      FROM information 
      ORDER BY CAST(SUBSTRING(userID, 5) AS UNSIGNED) DESC 
      LIMIT 1
    `);

    let newNumber = 1;
    if (rows.length > 0) {
      const lastID = rows[0].userID;   // e.g. "JRCW49"
      const lastNumber = parseInt(lastID.replace(/^JRCW/, ''), 10);
      newNumber = lastNumber + 1;
    }

    // Generate next ID
    const newUserID = `JRCW${newNumber}`;
    req.newUserID = newUserID;

    console.log("✅ Generating UserID:", newUserID);
    next();
  } catch (err) {
    console.error("❌ generateUserID error:", err);
    res.status(500).json({ success: false, message: 'Failed to generate userID' });
  }
};

module.exports = generateUserID;