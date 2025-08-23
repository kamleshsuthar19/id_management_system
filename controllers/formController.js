const db = require('../config/db');

exports.submitForm = async (req, res) => {
  try {
    console.log("Incoming form data:", req.body);
    console.log("Assigned UserID:", req.newUserID);
    console.log("Merged Aadhar PDF:", req.body.aadharPdf);
    console.log("Uploaded files:", req.files);

    const {
      name,
      fatherName,
      maritalStatus,
      gender,
      dateOfBirth,
      dateOfJoining,
      department,
      designation,
      site,
      mobileNumber,
      aadharNumber,
      accountNumber,
      ifsc,
      bankName,
      remarks
    } = req.body;

    const userID = req.newUserID;

    // file paths
    const aadharPdf = req.body.aadharPdf;
    const panPdf = req.files['panCard'] ? `/uploads/${userID}/${req.files['panCard'][0].filename}` : null;
    const photoFront = req.files['photoFront'] ? `/uploads/${userID}/${req.files['photoFront'][0].filename}` : null;
    const photoLeft = req.files['photoLeft'] ? `/uploads/${userID}/${req.files['photoLeft'][0].filename}` : null;
    const photoRight = req.files['photoRight'] ? `/uploads/${userID}/${req.files['photoRight'][0].filename}` : null;
    const bankDetail = req.files['bankDetail'] ? `/uploads/${userID}/${req.files['bankDetail'][0].filename}` : null;

    await db.query(
      `INSERT INTO information 
        (userID, name, fatherName, maritalStatus, gender, dateOfBirth, dateOfJoining, department, designation, site, 
         mobileNumber, aadharNumber, accountNumber, ifsc, bankName, remarks, 
         aadharPdf, panPdf, photoFront, photoLeft, photoRight, bankDetail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userID, name, fatherName, maritalStatus, gender, dateOfBirth, dateOfJoining, department, designation, site,
        mobileNumber, aadharNumber, accountNumber, ifsc, bankName, remarks,
        aadharPdf, panPdf, photoFront, photoLeft, photoRight, bankDetail
      ]
    );

    console.log("✅ DB Insert Success");
    res.status(200).send("Form submitted successfully");
  } catch (dbErr) {
    console.error("❌ DB Insert Failed:", dbErr.sqlMessage || dbErr);
    return res.status(500).send("Database insert error");
  }
};