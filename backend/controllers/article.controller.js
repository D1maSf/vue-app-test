const ArticleService = require('../services/article.service');
const fs = require('fs').promises;
const path = require('path');

class ArticleController {
    constructor(pool) {
        this.pool = pool;
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
                data: articles, // Массив статей
                meta: {
                    current_page: page,
                    per_page: perPage,
                    total_pages: totalPages,
                    total
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
        console.log(`[CONTROLLER] createArticle - User ID: ${req.user?.id}`);
        console.log('req.headers:', {
            contentType: req.headers['content-type'],
            authorization: req.headers.authorization
        });
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
        try {
            const { title, content, image_url: newImageUrl } = req.body;
            let imageUrl = newImageUrl;

            if (!title || !content) {
                console.error('[CONTROLLER] createArticle - Заголовок и контент обязательны');
                return res.status(400).json({ error: 'Заголовок и контент обязательны' });
            }

            if (req.file) {
                imageUrl = `/images/${req.file.filename}`;
                console.log('[CONTROLLER] createArticle - Новый файл загружен:', imageUrl);
            } else if (!imageUrl) {
                console.error('[CONTROLLER] createArticle - Изображение или image_url обязательны');
                return res.status(400).json({ error: 'Изображение или image_url обязательны' });
            }

            console.log('[CONTROLLER] createArticle - Данные для создания:', { title, content, image_url: imageUrl });

            // Исправляем вызов create
            const article = await this.articleService.createArticle(title, content, req.user?.id, imageUrl);
            if (!article) {
                console.error('[CONTROLLER] createArticle - Creation failed');
                return res.status(400).json({ error: 'Не удалось создать статью' });
            }

            console.log('[CONTROLLER] createArticle - Статья создана:', article);
            res.status(201).json({ data: { article } });
        } catch (error) {
            console.error('[CONTROLLER] createArticle - Error:', error.message, error.stack);
            next(error);
        }
    };

    updateArticle = async (req, res, next) => {
        console.log(`[CONTROLLER] updateArticle - Article ID: ${req.params.id}, User ID: ${req.user?.id}`);
        console.log('req.headers:', {
            contentType: req.headers['content-type'],
            authorization: req.headers.authorization
        });
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
        try {
            const { id } = req.params;
            const { title, content, image_url: newImageUrl } = req.body;
            let imageUrl = newImageUrl;

            if (!title || !content) {
                console.error('[CONTROLLER] updateArticle - Заголовок и контент обязательны');
                return res.status(400).json({ error: 'Заголовок и контент обязательны' });
            }

            // Получаем текущую статью для oldImagePath
            const currentArticleQuery = await this.pool.query('SELECT image_url FROM articles WHERE id = $1', [id]);
            if (!currentArticleQuery.rows.length) {
                console.error('[CONTROLLER] updateArticle - Статья не найдена');
                return res.status(404).json({ error: 'Статья не найдена' });
            }
            const oldImagePath = currentArticleQuery.rows[0].image_url;
            console.log('[CONTROLLER] updateArticle - Old image path:', oldImagePath);

            if (req.file) {
                imageUrl = `/images/${req.file.filename}`;
                console.log('[CONTROLLER] updateArticle - Новый файл загружен:', imageUrl);
                // Удаляем старое изображение, если оно есть
                if (oldImagePath) {
                    const fullPath = path.join(__dirname, '..', 'public', oldImagePath);
                    try {
                        fs.unlink(fullPath);
                        console.log('[CONTROLLER] updateArticle - Старое изображение удалено:', fullPath);
                    } catch (err) {
                        console.warn('[CONTROLLER] updateArticle - Не удалось удалить старое изображение:', err.message);
                    }
                }
            } else if (!imageUrl && !oldImagePath) {
                console.error('[CONTROLLER] updateArticle - Изображение или image_url обязательны');
                return res.status(400).json({ error: 'Изображение или image_url обязательны' });
            } else if (!imageUrl) {
                imageUrl = oldImagePath; // Сохраняем старый путь
            }

            console.log('[CONTROLLER] updateArticle - Данные для обновления:', { title, content, image_url: imageUrl });

            const updateData = { title, content, image_url: imageUrl };
            const article = await this.articleService.updateArticle(id, req.user?.id, updateData);
            if (!article) {
                console.error('[CONTROLLER] updateArticle - Update failed');
                return res.status(400).json({ error: 'Не удалось обновить статью' });
            }

            console.log('[CONTROLLER] updateArticle - Статья обновлена:', article);
            res.status(200).json({ data: { article } });
        } catch (error) {
            console.error('[CONTROLLER] updateArticle - Error:', error.message, error.stack);
            next(error);
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
