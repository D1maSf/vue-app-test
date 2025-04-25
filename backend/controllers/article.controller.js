const ArticleService = require('../services/article.service');

class ArticleController {
    constructor(pool) {
        this.articleService = new ArticleService(pool);
    }

    getArticles = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.per_page) || 6;

            if (page < 1 || perPage < 1) {
                return res.status(400).json({ error: 'Некорректные параметры пагинации' });
            }

            const articles = await this.articleService.getAll(page, perPage);
            const total = await this.articleService.getCount();
            const totalPages = Math.ceil(total / perPage);

            return res.json({
                data: articles,
                meta: {
                    current_page: page,
                    per_page: perPage,
                    total_pages: totalPages,
                    total: total,
                }
            });
        } catch (error) {
            next(error);
        }
    };

    getArticleById = async (req, res, next) => {
        try {
            const article = await this.articleService.getArticleById(req.params.id);
            res.json(article);
        } catch (error) {
            if (error.message === 'Article not found') {
                res.status(404).json({ error: 'Статья не найдена' });
            } else {
                next(error);
            }
        }
    };

    createArticle = async (req, res, next) => {
        try {
            const { title, content } = req.body;
            const userId = req.user.id;
            const imageFile = req.file;

            const article = await this.articleService.createArticle(
                title,
                content,
                userId,
                imageFile
            );

            res.status(201).json(article);
        } catch (error) {
            next(error);
        }
    };

    updateArticle = async (req, res, next) => {
        try {
            const article = await this.articleService.updateArticle(
                req.params.id,
                req.user.id,
                req.body
            );
            res.json(article);
        } catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Статья не найдена' });
            } else if (error.message.includes('unauthorized')) {
                res.status(403).json({ error: 'Нет прав на редактирование статьи' });
            } else {
                next(error);
            }
        }
    };

    deleteArticle = async (req, res, next) => {
        try {
            await this.articleService.deleteArticle(req.params.id, req.user.id);
            res.status(204).send();
        } catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Статья не найдена' });
            } else if (error.message.includes('unauthorized')) {
                res.status(403).json({ error: 'Нет прав на удаление статьи' });
            } else {
                next(error);
            }
        }
    };

    uploadImage = async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            return res.json({ url: `/images/${req.file.filename}` });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ArticleController;
