const express = require('express');
const router = express.Router();

const generateUserID = require('../middlewares/generateUserID');
const upload = require('../middlewares/upload');
const mergeAadhar = require('../middlewares/mergeAadhar');
const formController = require('../controllers/formController');

// POST /submit
router.post(
  '/submit',
  generateUserID,
  upload,
  mergeAadhar,
  formController.submitForm
);

module.exports = router;