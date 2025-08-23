const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const generationController = require('../controllers/generationController');
const generateUserID = require('../middlewares/generateUserID');

// Render form
// Render form
router.get("/id-generation", generateUserID, (req, res) => {
  console.log("🔎 Passing UserID to EJS:", req.newUserID);
  res.render("id-generation", { userID: req.newUserID });
});

// Submit form
router.post(
  '/submit',
  generateUserID,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ success: false, message: 'File upload error.' });
      }
      next();
    });
  },
  generationController.submitForm
);

// ID card page
router.get('/id-card/:userID', generationController.renderIdCard);

// Download ID card as PDF
router.get('/export/:userID', generationController.exportPDF);

module.exports = router;