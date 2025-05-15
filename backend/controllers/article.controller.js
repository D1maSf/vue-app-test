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
        console.log(`[CONTROLLER] updateArticle - ID: ${req.params.id}, User ID: ${req.user.id}`);
        console.log('Полный req.body:', req.body);
console.log('Файл в запросе:', req.file);
        try {
            const { id } = req.params;
            const { title, content } = req.body;
            let imageUrl = req.body.image_url;
    
            // Если загружено новое изображение
            if (req.file) {
                // Удаляем старое изображение, если оно есть и не является дефолтным
                if (imageUrl && imageUrl.startsWith('/images/') && !imageUrl.includes('default')) {
                    try {
                        const fileName = path.basename(imageUrl); // Безопасное получение имени файла
                        const oldImagePath = path.join(__dirname, '..', 'public', 'images', fileName);
                        
                        // Проверка существования файла
                        try {
                            await fs.promises.access(oldImagePath);
                            
                            // Дополнительная проверка, что это действительно файл изображения
                            const stats = await fs.promises.stat(oldImagePath);
                            if (stats.isFile()) {
                                await fs.promises.unlink(oldImagePath);
                                console.log(`Старое изображение успешно удалено: ${oldImagePath}`);
                            } else {
                                console.warn(`Указанный путь не является файлом: ${oldImagePath}`);
                            }
                        } catch (accessError) {
                            console.warn(`Файл не найден, удаление не требуется: ${oldImagePath}`);
                        }
                    } catch (error) {
                        console.error('Ошибка при удалении старого изображения:', error);
                        // Не прерываем выполнение, но логируем ошибку
                    }
                }
    
                // Сохраняем новое изображение
                imageUrl = `/images/${req.file.filename}`;
            }
    
            // Подготовка данных для обновления
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (imageUrl !== undefined) updateData.image_url = imageUrl;
    
            console.log('[CONTROLLER] updateArticle - Data to update:', JSON.stringify(updateData, null, 2));
    
            // Обновление статьи
            const article = await this.articleService.updateArticle(id, req.user.id, updateData);
            
            if (!article) {
                console.error('[CONTROLLER] updateArticle - Service returned no article');
                return res.status(404).json({ error: 'Article not found' });
            }
    
            // Подготовка метаданных для ответа
            const total = await this.articleService.getCount();
            const perPage = parseInt(req.query.per_page) || 6;
            const totalPages = Math.ceil(total / perPage);
            const currentPage = parseInt(req.query.page) || 1;
    
            res.json({
                data: { 
                    article, 
                    meta: { 
                        total,
                        total_pages: totalPages,
                        per_page: perPage,
                        current_page: currentPage
                    }
                }
            });
        } catch (error) {
            console.error('[CONTROLLER] updateArticle - Error:', error);
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
