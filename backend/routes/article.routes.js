const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const ArticleController = require('../controllers/article.controller');

const router = express.Router();

module.exports = (pool) => {
    const articleController = new ArticleController(pool);

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

    return router;
};
