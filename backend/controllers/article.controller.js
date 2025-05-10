const ArticleService = require('../services/article.service');
const fs = require('fs').promises;
const path = require('path');

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
            console.log('--- createArticle req.body ---:', req.body); // Строка для отладки
            const { title, content, image_url } = req.body; 
            const userId = req.user.id;

            const article = await this.articleService.createArticle(
                title,
                content,
                userId,
                image_url 
            );

            res.status(201).json(article);
        } catch (error) {
            next(error);
        }
    };

    updateArticle = async (req, res, next) => {
        console.log(`[CONTROLLER] updateArticle - ID: ${req.params.id}, User ID: ${req.user.id}`); // Лог Б1
        console.log('[CONTROLLER] updateArticle - Request body:', JSON.stringify(req.body, null, 2)); // Лог Б2
        try {
            const { id } = req.params;
            const { title, content } = req.body;
            let imageUrl = req.body.image_url; // Получаем текущий URL изображения

              // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение, если оно есть
            if (imageUrl && imageUrl.startsWith('/images/')) {
                const fileName = imageUrl.split('/').pop();
                // Используем process.cwd() для получения корневой директории проекта
                const oldImagePath = path.join(process.cwd(), 'public', 'images', fileName);
                
                try {
                    const fileExists = await fs.access(oldImagePath).then(() => true).catch(() => false);
                    if (fileExists) {
                        await fs.unlink(oldImagePath);
                        console.log(`Старое изображение удалено: ${oldImagePath}`);
                    } else {
                        console.log(`Старое изображение не найдено: ${oldImagePath}`);
                    }
                } catch (error) {
                    console.error('Ошибка при удалении старого изображения:', error);
                }
            }

            // Сохраняем новое изображение
            imageUrl = `/images/${req.file.filename}`;
        }

            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (imageUrl !== undefined) updateData.image_url = imageUrl;

            console.log('[CONTROLLER] updateArticle - Data to update (updateData):', JSON.stringify(updateData, null, 2)); // Лог Б3

            if (Object.keys(updateData).length === 0) {
                console.log('[CONTROLLER] updateArticle - No data to update, returning original article or 400.');
            }

            const article = await this.articleService.updateArticle(
                req.params.id,
                req.user.id,
                updateData
            );
            console.log('[CONTROLLER] updateArticle - Article from service:', JSON.stringify(article, null, 2)); // Лог Б4
            
            if (!article) {
                console.error('[CONTROLLER] updateArticle - Service returned no article (null or undefined).');
            }

            const total = await this.articleService.getCount();
            const perPage = req.query.per_page ? parseInt(req.query.per_page) : 6; 
            const totalPages = Math.ceil(total / perPage);
            const currentPage = req.query.page ? parseInt(req.query.page) : 1; 
            console.log('[CONTROLLER] updateArticle - Sending response back to client.'); // Лог Б5
            res.json({
                data: { 
                    data: article, 
                    meta: { 
                        total,
                        total_pages: totalPages,
                        per_page: perPage,
                        current_page: currentPage
                    }
                }
            });
        } catch (error) {
            console.error('[CONTROLLER] updateArticle - Error:', error.message, error.stack); // Лог Б6
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
