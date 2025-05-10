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

    async createArticle(title, content, userId, imageUrl = null) {
        try {
            return await this.articleModel.create(title, content, userId, imageUrl);
        } catch (error) {
            throw new Error(`Error creating article: ${error.message}`);
        }
    }

    async updateArticle(id, userId, updateData) {
        console.log(`[SERVICE] updateArticle - ID: ${id}, User ID: ${userId}`); 
        console.log('[SERVICE] updateArticle - Data to update:', JSON.stringify(updateData, null, 2)); 
        try {
            const existingArticle = await this.articleModel.findById(id);
            if (!existingArticle) {
                console.log(`[SERVICE] updateArticle - Article with ID ${id} not found.`); 
                return null; 
            }

            if (Object.keys(updateData).length === 0) {
                console.log('[SERVICE] updateArticle - No fields to update. Returning existing article.'); 
                return existingArticle; 
            }

            const updateArticle = async (id, data) => {
                try {
                    const [result] = await this.pool.query(
                        'UPDATE articles SET title = COALESCE($1, title), content = COALESCE($2, content), image_url = COALESCE($3, image_url) WHERE id = $4 RETURNING *',
                        [data.title, data.content, data.image_url, id]
                    );
                    return result.rows[0];
                } catch (error) {
                    console.error('Ошибка при обновлении статьи:', error);
                    throw error;
                }
            };

            const updatedArticle = await updateArticle(id, updateData); 
            console.log('[SERVICE] updateArticle - Result from model.update:', JSON.stringify(updatedArticle, null, 2)); 
            return updatedArticle; 
        } catch (error) {
            console.error(`[SERVICE] updateArticle - Error: ${error.message}`, error.stack); 
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
