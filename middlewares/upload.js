const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create the destination folder using only the userID
        const userFolder = path.join(__dirname, '..', 'Public', 'uploads', req.newUserID);
        fs.mkdir(userFolder, { recursive: true }, (err) => {
            if (err) return cb(err);
            cb(null, userFolder);
        });
    },
    filename: function (req, file, cb) {
        // The filename should also be updated to just the user ID and field name
        const ext = path.extname(file.originalname);
        cb(null, `${req.newUserID}_${file.fieldname}${ext}`);
    }
});

// Configure Multer to handle multiple fields
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB file size limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only JPEG, JPG, and PNG images
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("File upload only supports the following filetypes - " + filetypes));
    }
}).fields([
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'bankDetail', maxCount: 1 },
    { name: 'photoFront', maxCount: 1 },
    { name: 'photoLeft', maxCount: 1 },
    { name: 'photoRight', maxCount: 1 }
]);

module.exports = upload;