const express = require('express');
const { v4: uuidv4 } = require('crypto').randomUUID ? require('crypto') : { v4: () => Date.now().toString() };
const supabase = require('../services/supabase');
const uploadImage = require('../middlewares/uploadImage');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

const BUCKET = 'quiz-images';

// ЗАГРУЗКА КАРТИНКИ
// POST /api/images/upload
router.post('/upload', authMiddleware, uploadImage.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const folder = req.body.folder || 'quizzes';
        const ext = req.file.mimetype.split('/')[1];
        const filename = `${folder}/${req.user.userId}-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(filename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) {
            return res.status(500).json({ message: 'Upload failed', error: error.message });
        }

        const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filename);

        res.status(201).json({ url: data.publicUrl });
    } catch (e) {
        next(e);
    }
});

// УДАЛЕНИЕ КАРТИНКИ
// DELETE /api/images?path=quizzes/xxx.png
router.delete('/', authMiddleware, async (req, res, next) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ message: 'Path query param is required' });
        }

        const { error } = await supabase.storage
            .from(BUCKET)
            .remove([path]);

        if (error) {
            return res.status(500).json({ message: 'Delete failed', error: error.message });
        }

        res.json({ message: 'Image deleted successfully' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;