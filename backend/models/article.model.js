class ArticleModel {
    constructor(pool) {
        this.pool = pool;
    }

    // Создание новой статьи
    async create(title, content, userId, imageUrl = null) {
        try {
            const query = {
                text: `
                    INSERT INTO articles(title, content, user_id, image_url, created_at)
                    VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    RETURNING *
                `,
                values: [title, content, userId, imageUrl],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating article: ${error.message}`);
        }
    }

    // Получение всех статей с пагинацией
    async getAll(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const query = {
                text: `
                    SELECT a.*, u.username as author_name
                    FROM articles a
                    JOIN users u ON a.user_id = u.id
                    ORDER BY a.created_at DESC
                    LIMIT $1 OFFSET $2
                `,
                values: [limit, offset],
            };
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting articles: ${error.message}`);
        }
    }

    // Получение общего количества статей
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

    // Получение статьи по ID
    async getById(id) {
        try {
            const query = {
                text: `
                    SELECT a.*, u.username as author_name
                    FROM articles a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.id = $1
                `,
                values: [id],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting article: ${error.message}`);
        }
    }

    // Обновление статьи
    async update(id, userId, updateData) {
        try {
            const setClause = Object.keys(updateData)
                .map((key, index) => `${key} = $${index + 3}`)
                .join(', ');
            const values = [id, userId, ...Object.values(updateData)];
            
            const query = {
                text: `
                    UPDATE articles 
                    SET ${setClause} 
                    WHERE id = $1 AND user_id = $2
                    RETURNING *
                `,
                values,
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating article: ${error.message}`);
        }
    }

    // Удаление статьи
    async delete(id, userId) {
        try {
            const query = {
                text: 'DELETE FROM articles WHERE id = $1 AND user_id = $2 RETURNING *',
                values: [id, userId],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error deleting article: ${error.message}`);
        }
    }
}

module.exports = ArticleModel;
