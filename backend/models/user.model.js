const { Pool } = require('pg');
const bcrypt = require('bcrypt');

class UserModel {
    constructor(pool) {
        this.pool = pool;
    }

    // Создание нового пользователя
    async create(username, password) {
        try {
            console.log('Создание пользователя с данными:', {
                username,
                email: `${username}@example.com`,
                password_hash: password
            });
            
            const query = {
                text: 'INSERT INTO users(username, email, password_hash, is_admin) VALUES($1, $2, $3, $4) RETURNING id, username, email, is_admin',
                values: [username, `${username}@example.com`, password, false],
            };
            
            console.log('SQL запрос для создания пользователя:', query);
            
            const result = await this.pool.query(query);
            console.log('Полный результат создания пользователя:', result);
            return result.rows[0];
        } catch (error) {
            console.error('Ошибка при создании пользователя:', error);
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    // Поиск пользователя по имени
    async findByUsername(username) {
        try {
            const query = {
                text: 'SELECT id, username, email, password_hash, is_admin FROM users WHERE username = $1',
                values: [username],
            };
            const result = await this.pool.query(query);
            console.log('SQL запрос для поиска пользователя:', query);
            console.log('Результат поиска пользователя:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('Ошибка при поиске пользователя:', error);
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    // Поиск пользователя по ID
    async findById(id) {
        try {
            const query = {
                text: 'SELECT id, username, email, is_admin FROM users WHERE id = $1',
                values: [id],
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    // Проверка пароля
    async verifyPassword(plainPassword, hashedPassword) {
        try {
            console.log('Проверка пароля в verifyPassword:', {
                plainPassword,
                hashedPassword
            });
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            console.log('Результат проверки:', result);
            return result;
        } catch (error) {
            console.error('Ошибка при проверке пароля:', error);
            return false;
        }
    }

    // Обновление данных пользователя
    async update(userId, updateData) {
        try {
            const setClause = Object.keys(updateData)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const values = [userId, ...Object.values(updateData)];
            
            const query = {
                text: `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
                values,
            };
            const result = await this.pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }
}

module.exports = UserModel;
