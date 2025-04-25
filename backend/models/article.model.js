class ArticleModel {
    constructor(pool) {
        this.pool = pool;
    }

    // Создание новой статьи
    async create(title, content, userId, image_url = null) {
        try {
            const query = {
                text: `
                    INSERT INTO articles(title, content, author_id, image_url, created_at)
                    VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    RETURNING *
                `,
                values: [title, content, userId, image_url],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating article: ${error.message}`);
        }
    }

    // Получение всех статей с пагинацией
    async getAll(page = 1, perPage = 10) {
        try {
            const offset = (page - 1) * perPage;
            const query = {
                text: `
                    SELECT a.*, u.username as author_name
                    FROM articles a
                    JOIN users u ON a.author_id = u.id
                    ORDER BY a.created_at DESC
                    LIMIT $1 OFFSET $2
                `,
                values: [perPage, offset],
            };
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting articles: ${error.message}`);
        }
    }

    // Получение статьи по ID
    async getById(id) {
        try {
            const query = {
                text: `
                    SELECT a.*, u.username as author_name
                    FROM articles a
                    JOIN users u ON a.author_id = u.id
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
                    SET ${setClause}, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1 AND author_id = $2
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
                text: 'DELETE FROM articles WHERE id = $1 AND author_id = $2 RETURNING *',
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
