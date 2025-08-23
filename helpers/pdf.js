const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Combine multiple images into a single PDF
 * @param {string[]} imagePaths - Array of image paths
 * @param {string} outputPDFPath - Output PDF file path
 */
const combineImagesToPDF = (imagePaths, outputPDFPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPDFPath);

    doc.pipe(stream);

    imagePaths.forEach((imagePath, index) => {
      try {
        if (fs.existsSync(imagePath)) {
          doc.addPage();
          doc.image(imagePath, {
            fit: [500, 700],
            align: 'center',
            valign: 'center',
          });
        } else {
          console.warn(`⚠️ Skipping missing file: ${imagePath}`);
        }
      } catch (err) {
        console.error(`❌ Error processing image: ${imagePath}`, err);
      }
    });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

/**
 * Convert a single image into a PDF
 * @param {string} imagePath - Path to image
 * @param {string} outputPath - Path to output PDF
 */
const convertImageToPDF = (imagePath, outputPath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(imagePath)) {
      return reject(new Error(`File not found: ${imagePath}`));
    }

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.image(imagePath, {
      fit: [500, 700],
      align: 'center',
      valign: 'center',
    });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

module.exports = { combineImagesToPDF, convertImageToPDF };