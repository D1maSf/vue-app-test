const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcrypt');
const config = require('../config/app');
const { UserModel } = require('../models');

class AuthService {
    constructor(pool) {
        this.userModel = new UserModel(pool);
    }

    async verifyRecaptcha(recaptcha) {
        try {
            const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
                params: {
                    secret: config.recaptchaSecret,
                    response: recaptcha
                }
            });
            return response.data.success;
        } catch (error) {
            console.error('Ошибка проверки reCAPTCHA:', error);
            return false;
        }
    }

    async hashPassword(password) {
        try {
            const hash = await bcrypt.hash(password, 10);
            console.log('Сгенерированный хэш:', hash);
            return hash;
        } catch (error) {
            console.error('Ошибка генерации хэша:', error);
            throw new Error(`Error hashing password: ${error.message}`);
        }
    }

    async comparePasswords(plainPassword, hashedPassword) {
        try {
            console.log('Сравниваемые значения:', {
                plainPassword,
                hashedPassword,
                typeofPlain: typeof plainPassword,
                typeofHashed: typeof hashedPassword
            });
            
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            console.log('Результат сравнения паролей:', result);
            return result;
        } catch (error) {
            console.error('Ошибка сравнения паролей:', error);
            throw new Error(`Error comparing passwords: ${error.message}`);
        }
    }

    async register(username, password, recaptcha) {
        console.log('Начало регистрации пользователя:', { username });
        
        // Проверка reCAPTCHA
        const isRecaptchaValid = await this.verifyRecaptcha(recaptcha);
        console.log('Результат проверки reCAPTCHA:', isRecaptchaValid);
        
        if (!isRecaptchaValid) {
            throw new Error('Ошибка проверки reCAPTCHA');
        }

        // Хешируем пароль
        const hashedPassword = await this.hashPassword(password);
        console.log('Хэш пароля для сохранения:', hashedPassword);

        // Проверяем существование пользователя
        const existingUser = await this.userModel.findByUsername(username);
        console.log('Существующий пользователь:', existingUser);
        
        if (existingUser) {
            throw new Error('Пользователь уже существует');
        }

        // Создаем нового пользователя
        console.log('Сохранение пользователя с хэшем:', hashedPassword);
        const user = await this.userModel.create(username, hashedPassword);
        console.log('Пользователь успешно создан:', user);
        
        return {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin
        };
    }

    async checkUsername(username) {
        const exists = await this.userModel.exists(username);
        return exists;
    }

    async login(username, password) {
        console.log('Попытка входа:', { username });

        // Ищем пользователя
        const user = await this.userModel.findByUsername(username);
        console.log('Найденный пользователь:', { 
            id: user?.id,
            username: user?.username,
            hasPassword: !!user?.password_hash
        });

        if (!user) {
            throw new Error('Неверное имя пользователя или пароль');
        }

        // Проверяем пароль
        console.log('Проверка пароля:', { 
            providedPassword: password,
            storedPassword: user.password_hash,
            typeofProvided: typeof password,
            typeofStored: typeof user.password_hash
        });

        // Проверяем длину строк
        console.log('Длина пароля:', password.length);
        console.log('Длина хеша:', user.password_hash.length);

        const validPassword = await this.comparePasswords(password, user.password_hash);
        console.log('Результат проверки пароля:', validPassword);

        if (!validPassword) {
            throw new Error('Неверное имя пользователя или пароль');
        }

        // Создаем JWT токен
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin
            }
        };
    }

    async getCurrentUser(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        return {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin
        };
    }
}

module.exports = AuthService;
