module.exports = {
    port: process.env.BACKEND_PORT || 3000,
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN_PROD : process.env.CORS_ORIGIN,
    uploadDir: 'public/images',
    fileSize: 5 * 1024 * 1024, // 5MB
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY
};
