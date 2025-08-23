const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const puppeteer = require('puppeteer');
const { combineImagesToPDF, convertImageToPDF } = require('../helpers/pdf');


// ---------- Helpers ----------
function ensureFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

// MoveFile helper to return the correct file name and handle errors gracefully
function moveFile(oldPath, newPath) {
  try {
    fs.renameSync(oldPath, newPath);
    return true;
  } catch (err) {
    console.error("❌ File move error:", err);
    return false;
  }
}

// Helper to return the filename for later path construction
async function generatePDFfromImages(images, filename, folderPath) {
  if (images.length === 0) return null;
  const outputPath = path.join(folderPath, filename);

  if (images.length > 1) {
    await combineImagesToPDF(images, outputPath);
  } else {
    await convertImageToPDF(images[0], outputPath);
  }

  // cleanup originals
  for (const img of images) {
    try {
      fs.unlinkSync(img);
    } catch {
      // ignore if file is already removed or cannot be deleted
    }
  }

  return filename; // 👈 return so it can be saved in DB
}

// SavePhoto to return the full relative path
function savePhoto(file, userID, label, folderPath) {
  if (!file) return null;
  const ext = path.extname(file.path);
  const newFilename = `${userID}_${label}${ext}`;
  const newPath = path.join(folderPath, newFilename);
  moveFile(file.path, newPath);

  // Store relative path (from Public root) including the folder name
  return `uploads/${userID}/${newFilename}`;
}

// Capitalize the first letter of a string
function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// To convert date as mm-dd-yyyy
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}


// ---------- Render Form ----------
const renderForm = (req, res) => {
  res.render('id-generation');
};


// ---------- Submit Form ----------
const submitForm = async (req, res) => {
  const newUserID = req.newUserID;
  const files = req.files;

  const {
    name: rawName, fatherName: rawFatherName, maritalStatus, gender,
    dob: rawDob, doj: rawDoj, department, designation, site,
    mobileNumber, aadharNumber, holderName: rawHolderName, accountNumber, ifsc: rawIfsc, bankName, remarks
  } = req.body;

  // Use only userID for folder creation to ensure it's a stable path
  const folderPath = path.join(process.cwd(), 'Public', 'uploads', newUserID);

  ensureFolder(folderPath);

  // Capitalize name before storing
  const name = capitalizeWords(rawName);
  const fatherName = capitalizeWords(rawFatherName);
  const holderName = capitalizeWords(rawHolderName);
  const ifsc = rawIfsc?.toUpperCase().trim();

  // Normalize dates or set to null if empty
  const dob = rawDob?.trim() || null;
  const doj = rawDoj?.trim() || null;

  try {
    // Aadhaar (front/back → PDF)
    const aadharImages = [
      files?.aadharFront?.[0]?.path,
      files?.aadharBack?.[0]?.path
    ].filter(Boolean);
    const aadharPdfFilename = await generatePDFfromImages(
      aadharImages,
      `${newUserID}_Aadhar.pdf`,
      folderPath
    );
    const aadharPdfPath = aadharPdfFilename ? `uploads/${newUserID}/${aadharPdfFilename}` : null;

    // PAN → PDF
    const panPdfFilename = await generatePDFfromImages(
      files?.panCard?.map(f => f.path) || [],
      `${newUserID}_PAN.pdf`,
      folderPath
    );
    const panPdfPath = panPdfFilename ? `uploads/${newUserID}/${panPdfFilename}` : null;

    // Bank → PDF
    const bankPdfFilename = await generatePDFfromImages(
      files?.bankDetail?.map(f => f.path) || [],
      `${newUserID}_Bank.pdf`,
      folderPath
    );
    const bankDetailPath = bankPdfFilename ? `uploads/${newUserID}/${bankPdfFilename}` : null;

    // Profile photos
    const photoFront = savePhoto(files?.photoFront?.[0], newUserID, 'photoFront', folderPath);
    const photoLeft = savePhoto(files?.photoLeft?.[0], newUserID, 'photoLeft', folderPath);
    const photoRight = savePhoto(files?.photoRight?.[0], newUserID, 'photoRight', folderPath);

    // Insert into DB
    const sql = `
            INSERT INTO information (
                userID, name, fatherName, maritalStatus, gender, dob, doj, department, designation, site,
                mobileNumber, aadharNumber, holderName, accountNumber, ifsc, bankName, aadharPdf, panPdf, bankDetail, photoFront, photoLeft, photoRight, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const values = [
      newUserID, name, fatherName, maritalStatus, gender, dob, doj,
      department, designation, site, mobileNumber, aadharNumber, holderName, accountNumber, ifsc, bankName,
      aadharPdfPath, panPdfPath, bankDetailPath, photoFront, photoLeft, photoRight, remarks
    ];

    await db.query(sql, values);

    res.json({
      success: true,
      userID: newUserID,
      redirect: `/id-card/${newUserID}`
    });

  } catch (error) {
    console.error('❌ File Processing Error:', error);
    res.status(500).json({ success: false, message: 'File processing error', error: error.message });
  }
};


// ---------- Render ID Card ----------
const renderIdCard = async (req, res) => {
  const userID = req.params.userID;

  try {
    const [results] = await db.query('SELECT * FROM information WHERE userID = ?', [userID]);
    if (results.length === 0) return res.status(404).send('<h2>User not found</h2>');

    const user = results[0];

    // Format DOB and DOJ before sending
    user.dob = formatDate(user.dob);
    user.doj = formatDate(user.doj);

    res.render('id-card', { user });

  } catch (err) {
    console.error('❌ DB Fetch Error:', err);
    res.status(500).send('Database error.');
  }
};


// ---------- Export ID Card PDF ----------
const exportPDF = async (req, res) => {
  const userID = req.params.userID;
  const idCardUrl = `http://localhost:${process.env.PORT || 4500}/id-card/${userID}`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // safer for deployment
    });
    const page = await browser.newPage();

    // Force desktop viewport so card doesn't shrink
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    await page.goto(idCardUrl, { waitUntil: 'networkidle0' });

    // Wait for card to be fully rendered
    await page.waitForSelector('#idCard', { visible: true });

    // Find the card element
    const card = await page.$('#idCard');
    const cardBox = await card.boundingBox();

    // Generate PDF clipped to card size
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // respects CSS size if you use width/height in CSS
      width: `${cardBox.width}px`,
      height: `${cardBox.height}px`,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      pageRanges: '1'
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="IDCard_${userID}.pdf"`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF Export Error:', error);
    res.status(500).send('Failed to generate PDF.');
  }
};


// ---------- Exports ----------
module.exports = {
  renderForm,
  submitForm,
  renderIdCard,
  exportPDF
};