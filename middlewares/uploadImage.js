const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 5;

const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => { // 
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    },
});

module.exports = uploadImage;