const AuthService = require('../services/auth.service');

class AuthController {
    constructor(pool) {
        this.authService = new AuthService(pool);
    }

    register = async (req, res, next) => {
        try {
            const { username, password, recaptcha } = req.body;
            const user = await this.authService.register(username, password, recaptcha);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    };

    login = async (req, res, next) => {
        try {
            const { username, password } = req.body;
            const result = await this.authService.login(username, password);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getCurrentUser = async (req, res, next) => {
        try {
            const user = await this.authService.getCurrentUser(req.user.id);
            res.json(user);
        } catch (error) {
            next(error);
        }
    };

    checkUsername = async (req, res, next) => {
        try {
            const { username } = req.body;
            const exists = await this.authService.checkUsername(username);
            res.json({ exists });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = AuthController;
