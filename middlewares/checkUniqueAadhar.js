const db = require('../config/db');

const checkUniqueAadhar = async (req, res, next) => {
  try {
    const { aadharNumber } = req.body;

    if (!aadharNumber) {
      return res.status(400).json({ success: false, message: "Aadhar number is required" });
    }

    // Check if Aadhaar already exists
    const [rows] = await db.query(
      "SELECT userID FROM information WHERE aadharNumber = ?",
      [aadharNumber]
    );

    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "Aadhar number already exists" });
    }

    next();
  } catch (err) {
    console.error("❌ checkUniqueAadhar error:", err);
    res.status(500).json({ success: false, message: "Failed to validate Aadhar" });
  }
};

module.exports = checkUniqueAadhar;