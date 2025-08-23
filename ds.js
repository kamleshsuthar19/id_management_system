const db = require('../config/db');

async function getDashboard(req, res) {
  try {
    res.render('id-dashboard', { records: [] }); // Start empty; frontend will fetch via /records
  } catch (error) {
    console.error('❌ Dashboard page render error:', error);
    res.status(500).send('Error loading dashboard page');
  }
}

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

// (Optional) update record name (hooked up from dashboard JS)
async function updateRecord(req, res) {
  const { userID } = req.params;
  const { name } = req.body;

  if (!userID || !name) {
    return res.status(400).json({ error: 'Missing userID or name' });
  }

  try {
    const [result] = await db.query(
      'UPDATE information SET name=? WHERE userID=?',
      [name, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ error: 'DB error' });
  }
}

module.exports = {
  getDashboard,
  getWorkers,
  updateRecord
};