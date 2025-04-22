#!/bin/sh

# Ждем, пока база данных будет готова
echo "Waiting for database to be ready..."
sleep 5

# Проверяем доступность базы данных
echo "Checking database connection..."

# Запускаем сервер
echo "Starting server..."
exec node server.js
