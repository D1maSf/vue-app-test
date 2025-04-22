const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Файл слишком большой'
            });
        }
        return res.status(400).json({
            error: 'Ошибка загрузки файла'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    res.status(500).json({
        error: 'Внутренняя ошибка сервера'
    });
};

module.exports = errorHandler;
