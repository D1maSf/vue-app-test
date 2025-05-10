const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const ArticleController = require('../controllers/article.controller');

const router = express.Router();

module.exports = (pool) => {
    const articleController = new ArticleController(pool);
// Настройка multer для загрузки изображений
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(process.cwd(), 'public', 'images'));
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'));
        }
    }
});

    router.get('/', articleController.getArticles);
    router.get('/:id', articleController.getArticleById);
    
    router.post('/',
        authenticateToken,
        isAdmin,
        articleController.createArticle
    );
    
    router.put('/:id',
        authenticateToken,
        isAdmin,
        articleController.updateArticle
    );
    
    router.delete('/:id',
        authenticateToken,
        isAdmin,
        articleController.deleteArticle
    );

    router.post('/upload',
        authenticateToken,
        isAdmin,
        upload.single('image'),
        articleController.uploadImage
    );

    return router;
};
