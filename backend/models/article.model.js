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
    async getAll(page = 1, perPage = 6) {
        try {
            const offset = (page - 1) * perPage;
            const query = {
                text: `
                    SELECT a.*, u.username as author_name
                    FROM articles a
                    JOIN users u ON a.author_id = u.id
                    WHERE a.is_published = true
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

    async getIndexById(id) {
        const query = {
            text: `
            SELECT row_number - 1 AS index
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS row_number
                FROM articles
                WHERE is_published = true
            ) sub
            WHERE id = $1
        `,
            values: [id]
        };
        const result = await this.pool.query(query);
        console.log('Результат запроса getIndexById:', result.rows); // 👈

        if (result.rows.length === 0) {
            throw new Error('Article not found');
        }
        return result.rows[0].index;
    }

    // Обновление статьи
    async update(id, userId, updateData) {
        console.log(`[MODEL] update - ID: ${id}, User ID: ${userId}`);
        console.log('[MODEL] update - Data to update:', JSON.stringify(updateData, null, 2));

        if (!updateData || Object.keys(updateData).length === 0) {
            console.log('[MODEL] update - No data to update, returning null.');
            return null;
        }

        if (!Number.isInteger(userId)) {
            console.error('[MODEL] update - Invalid userId:', userId);
            throw new Error('Invalid userId: must be an integer');
        }

        try {
            const query = {
                text: `
                    UPDATE articles
                    SET title = COALESCE($1, title),
                        content = COALESCE($2, content),
                        image_url = COALESCE($3, image_url),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4 AND author_id = $5
                    RETURNING *
                `,
                values: [updateData.title, updateData.content, updateData.image_url, id, userId],
            };
            console.log('[MODEL] update - SQL query:', query.text);
            console.log('[MODEL] update - SQL values:', query.values);
            const result = await this.pool.query(query);
            console.log('[MODEL] update - Rows returned from DB:', JSON.stringify(result.rows, null, 2));
            return result.rows[0] || null; // Возвращаем первую строку или null
        } catch (error) {
            console.error('[MODEL] update - Database error:', error.message, error.stack);
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

    async findById(id) {
        console.log(`[MODEL] findById - ID: ${id}`); // Лог
        try {
            const query = {
                text: `
                    SELECT a.*, u.username as author_name 
                    FROM articles a
                    LEFT JOIN users u ON a.author_id = u.id
                    WHERE a.id = $1
                `,
                values: [id],
            };
            const { rows } = await this.pool.query(query);
            console.log(`[MODEL] findById - Rows for ID ${id}:`, JSON.stringify(rows)); // Лог
            return rows[0]; // Возвращает статью или undefined, если не найдена
        } catch (error) {
            console.error(`[MODEL] findById - Error finding article by ID ${id}:`, error.message, error.stack); // Лог
            throw new Error(`Error finding article by ID: ${error.message}`);
        }
    }

    async findByIdAndUser(id, userId) {
        console.log(`[MODEL] findByIdAndUser - ID: ${id}, User ID: ${userId}`);
        try {
            const query = {
                text: `
                    SELECT a.*, u.username as author_name 
                    FROM articles a
                    JOIN users u ON a.author_id = u.id
                    WHERE a.id = $1 AND a.author_id = $2
                `,
                values: [id, userId],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting article by ID and user: ${error.message}`);
        }
    }
}

module.exports = ArticleModel;
