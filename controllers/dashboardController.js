// controllers/dashboardController.js
const fs = require("fs").promises;
const path = require("path");
const db = require("../config/db"); // mysql2 connection pool

// ----------------------
// Get all workers
// ----------------------
async function getWorkers(req, res) {

  const { name, aadharNumber, mobileNumber, department, designation, site } = req.query;

  // Build parameterized WHERE safely
  const whereClauses = ['1=1'];
  const params = [];

  if (name) { whereClauses.push('name LIKE ?'); params.push(`%${name}%`); }
  if (aadharNumber) { whereClauses.push('aadharNumber = ?'); params.push(aadharNumber); }
  if (mobileNumber) { whereClauses.push('mobileNumber = ?'); params.push(mobileNumber); }
  if (department) { whereClauses.push('department = ?'); params.push(department); }
  if (designation) { whereClauses.push('designation = ?'); params.push(designation); }
  if (site) { whereClauses.push('site = ?'); params.push(site); }

  const sql = `
    SELECT 
      userID,
      name,
      fatherName,
      maritalStatus,
      gender,
      dob,
      doj,
      department,
      designation,
      site,
      mobileNumber,
      aadharNumber,
      holderName,
      accountNumber,
      ifsc,
      bankName,
      remarks,
      aadharPdf,
      panPdf,
      bankDetail,
      photoFront,
      photoLeft,
      photoRight
    FROM information
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY databaseId ASC
  `;

  try {
    const [rows] = await db.execute(sql, params);

    const workers = rows.map(row => ({
      userID: row.userID,
      name: row.name,
      fatherName: row.fatherName,
      maritalStatus: row.maritalStatus,
      gender: row.gender,
      dateOfBirth: row.dob,
      dateOfJoining: row.doj,
      department: row.department,
      designation: row.designation,
      site: row.site,
      mobileNumber: row.mobileNumber,
      aadharNumber: row.aadharNumber,
      holderName: row.holderName,
      accountNumber: row.accountNumber,
      ifsc: row.ifsc,
      bankName: row.bankName,
      remarks: row.remarks,
      aadharPdf: row.aadharPdf ? `/${row.aadharPdf}` : null,
      panPdf: row.panPdf ? `/${row.panPdf}` : null,
      bankDetail: row.bankDetail ? `/${row.bankDetail}` : null,
      photoFront: row.photoFront ? `/${row.photoFront}` : null,
      photoLeft: row.photoLeft ? `/${row.photoLeft}` : null,
      photoRight: row.photoRight ? `/${row.photoRight}` : null
    }));

    res.json(workers);
  } catch (err) {
    console.error('❌ Admin fetch error:', err);
    res.status(500).json({ error: 'DB error' });
  }
}

// ----------------------
// Get single worker by ID
// ----------------------
const getWorkerById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM information WHERE userID = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const worker = rows[0];
    res.json({
      ...worker,
      dob: worker.dob ? new Date(worker.dob).toISOString().split("T")[0] : null,
      doj: worker.doj ? new Date(worker.doj).toISOString().split("T")[0] : null
    });
  } catch (err) {
    console.error("❌ Error fetching worker:", err);
    res.status(500).json({ error: "Failed to fetch worker" });
  }
};

// ----------------------
// Delete worker
// ----------------------

const deleteWorker = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Fetch worker from DB
    const [rows] = await db.query("SELECT * FROM information WHERE userID = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Worker not found" });

    const worker = rows[0];
    const folderPath = path.join(__dirname, '..', 'Public/uploads', worker.userID);

    console.log('Trying to delete folder:', folderPath);

    // 2️⃣ Check if folder exists first
    try {
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        await fs.rm(folderPath, { recursive: true, force: true });
        console.log(`✅ Folder ${folderPath} deleted`);
      } else {
        console.warn(`⚠️ Path exists but is not a folder: ${folderPath}`);
      }
    } catch (err) {
      console.warn(`⚠️ Folder does not exist, skipping deletion: ${folderPath}`);
    }

    // 3️⃣ Delete worker from DB
    const [result] = await db.query("DELETE FROM information WHERE userID = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Worker not found in DB" });

    res.json({ success: true, message: `Worker ${id} deleted successfully along with folder` });

  } catch (err) {
    console.error("❌ Error deleting worker:", err);
    res.status(500).json({ error: "Failed to delete worker" });
  }
};

// ----------------------
// Update worker (basic)
// ----------------------
const updateWorker = async (req, res) => {
  // 1️⃣ Get the worker ID from the URL parameters
  const { id } = req.params;

  // 2️⃣ Get the updated data from the request body
  const updatedData = req.body;

  try {
    // 3️⃣ Construct the SQL UPDATE query dynamically from the request body
    // This makes the code flexible and secure against SQL injection.
    const keys = Object.keys(updatedData);
    const values = Object.values(updatedData);

    // Build the "SET" part of the query, e.g., "name = ?, fatherName = ?"
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    // The full SQL query, with the user ID as the last value
    const query = `UPDATE information SET ${setClause} WHERE userID = ?`;
    const finalValues = [...values, id];

    // 4️⃣ Execute the update query on the database
    const [result] = await db.query(query, finalValues);

    // 5️⃣ Check if any rows were affected to confirm the update
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Worker not found or no changes made." });
    }

    // 6️⃣ Send a success response back to the frontend
    res.json({ success: true, message: `Worker ${id} updated successfully.` });

  } catch (err) {
    // ❌ If an error occurs, log it and send a 500 status code
    console.error("❌ Error updating worker:", err);
    res.status(500).json({ error: "Failed to update worker details." });
  }
};

exports = module.exports = {
  getWorkers,
  getWorkerById,
  deleteWorker,
  updateWorker
};