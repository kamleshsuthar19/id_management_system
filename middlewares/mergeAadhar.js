const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const mergeAadhar = (req, res, next) => {
  try {
    const userID = req.newUserID;
    const uploadDir = path.join(__dirname, '..', 'Public', 'uploads', userID);

    const front = req.files['aadharFront'] ? req.files['aadharFront'][0].path : null;
    const back = req.files['aadharBack'] ? req.files['aadharBack'][0].path : null;

    if (front && back) {
      const mergedPath = path.join(uploadDir, `${userID}_aadhar.pdf`);
      const doc = new PDFDocument();

      const stream = fs.createWriteStream(mergedPath);
      doc.pipe(stream);

      doc.image(front, { fit: [500, 700], align: 'center', valign: 'center' });
      doc.addPage();
      doc.image(back, { fit: [500, 700], align: 'center', valign: 'center' });

      doc.end();

      stream.on('finish', () => {
        req.body.aadharPdf = `/uploads/${userID}/${userID}_aadhar.pdf`;
        next();
      });
    } else {
      req.body.aadharPdf = null;
      next();
    }
  } catch (err) {
    console.error("Error merging Aadhar files:", err);
    req.body.aadharPdf = null;
    next();
  }
};

module.exports = mergeAadhar;