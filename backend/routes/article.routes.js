const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const ArticleController = require('../controllers/article.controller');

const router = express.Router();

module.exports = (pool) => {
    const articleController = new ArticleController(pool);
    const upload = multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'public/images');
            },
            filename: function (req, file, cb) {
                cb(null, Date.now() + path.extname(file.originalname));
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB max file size
        },
        fileFilter: function (req, file, cb) {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error('Only image files are allowed!'));
            }
            cb(null, true);
        }
    });

    router.get('/', articleController.getArticles);
    router.get('/:id', articleController.getArticleById);
    
    router.post('/',
        authenticateToken,
        isAdmin,
        upload.single('image'),
        articleController.createArticle
    );
    
    router.put('/:id',
        authenticateToken,
        isAdmin,
        upload.single('image'),
        articleController.updateArticle
    );
    
    router.delete('/:id',
        authenticateToken,
        isAdmin,
        articleController.deleteArticle
    );

 /*   router.post('/upload',
        authenticateToken,
        isAdmin,
        upload.single('image'),
        articleController.uploadImage
    );
*/
    return router;
};
