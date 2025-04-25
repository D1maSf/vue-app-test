const { ArticleModel } = require('../models');
const fs = require('fs').promises;
const path = require('path');

class ArticleService {
    constructor(pool) {
        this.articleModel = new ArticleModel(pool);
        this.pool = pool;
    }

    async getAll(page = 1, perPage = 6) {
        try {
            const articles = await this.articleModel.getAll(page, perPage);
            const total = await this.getCount();
            const totalPages = Math.ceil(total / perPage);

            return {
                data: articles,
                meta: {
                    current_page: page,
                    per_page: perPage,
                    total_pages: totalPages,
                    total,
                }
            };
        } catch (error) {
            throw new Error(`Error getting articles: ${error.message}`);
        }
    }

    async getArticleById(id) {
        try {
            const article = await this.articleModel.getById(id);
            if (!article) {
                throw new Error('Article not found');
            }
            return article;
        } catch (error) {
            throw new Error(`Error getting article: ${error.message}`);
        }
    }

    async getCount() {
        try {
            const query = {
                text: 'SELECT COUNT(*) as total FROM articles'
            };
            const result = await this.pool.query(query);
            return parseInt(result.rows[0].total);
        } catch (error) {
            throw new Error(`Error counting articles: ${error.message}`);
        }
    }

    async createArticle(title, content, userId, imageFile = null) {
        try {
            let image_url = null;
            if (imageFile) {
                // Используем правильный путь к изображению
                image_url = `/images/${imageFile.filename}`;
            }
            
            return await this.articleModel.create(title, content, userId, image_url);
        } catch (error) {
            if (imageFile) {
                // Удаляем файл, если произошла ошибка
                const imagePath = path.join('public/images', imageFile.filename);
                await fs.unlink(imagePath).catch(console.error);
            }
            throw new Error(`Error creating article: ${error.message}`);
        }
    }

    async updateArticle(id, userId, updateData) {
        try {
            // Удаляем поля, которые не должны обновляться
            const { author_name, file, image, ...allowedUpdateData } = updateData;
            
            if (updateData.file) {
                // Если есть новый файл, обрабатываем его
                const imageUrl = `/images/${updateData.file.filename}`;
                allowedUpdateData.image_url = imageUrl;
            }
            
            const article = await this.articleModel.update(id, userId, allowedUpdateData);
            if (!article) {
                throw new Error('Article not found or unauthorized');
            }
            return article;
        } catch (error) {
            throw new Error(`Error updating article: ${error.message}`);
        }
    }

    async deleteArticle(id, userId) {
        try {
            const article = await this.articleModel.getById(id);
            if (!article) {
                throw new Error('Article not found');
            }

            if (article.image_url) {
                const imagePath = path.join('public', article.image_url);
                await fs.unlink(imagePath).catch(console.error);
            }

            const deletedArticle = await this.articleModel.delete(id, userId);
            if (!deletedArticle) {
                throw new Error('Unauthorized to delete this article');
            }

            return deletedArticle;
        } catch (error) {
            throw new Error(`Error deleting article: ${error.message}`);
        }
    }
}

module.exports = ArticleService;
