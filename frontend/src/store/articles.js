import { defineStore } from 'pinia';
import axios from 'axios';

export const useArticlesStore = defineStore('articles', {
    state: () => ({
        articles: [], // Статьи текущей страницы
        article: null, // Текущая статья
        pages: {}, // Кэш страниц: { 1: [...статьи...], 2: [...статьи...], ... }
        cachedArticle: {}, // Загружаем кэшированные статьи из localStorage
        // Кэш отдельных статей { id: article, id: article, ... }
        loading: false,
        error: null,
        uploadProgress: 0,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalArticles: 0,
            articlesPerPage: 4
        }
    }),

    actions: {

        clearCache() {
            // Очищаем локальное хранилище
            localStorage.removeItem('articles_pages');
            localStorage.removeItem('cachedArticles');
            localStorage.removeItem('cachedPagination');

            // Сбрасываем состояние в Pinia
            this.pages = {};
            this.cachedArticle = {};
            this.pagination = {
                currentPage: 1,
                totalPages: 1,
                totalArticles: 0,
                articlesPerPage: 4,
            };
            this.articles = [];
            this.article = null;

            console.log('Кэш очищен');
        },

        loadCachePagesBlog() {
            // Загружаем кэшированные страницы
            const cachedPages = JSON.parse(localStorage.getItem('articles_pages'));
            if (cachedPages && typeof cachedPages === 'object') {
                this.pages = cachedPages;
                console.log('Загружены страницы из кэша:', Object.keys(this.pages));
            }

            // Загружаем кэшированную пагинацию
            const cachedPagination = JSON.parse(localStorage.getItem('cachedPagination'));
            if (cachedPagination && typeof cachedPagination === 'object') {
                this.pagination = cachedPagination;
                console.log('Загружена пагинация из кэша:', this.pagination);
            }
        },

        loadCacheArticle() {
            // Загружаем кэшированные статьи
            const cachedArticles = JSON.parse(localStorage.getItem('cachedArticles'));
            if (cachedArticles && typeof cachedArticles === 'object') {
                this.cachedArticle = cachedArticles;
                console.log('Загружены статьи из кэша:', Object.keys(this.cachedArticle));
            }

        },


        // Загружаем кэш из localStorage при инициализации
        initializeCache() {
            const cachedPages = localStorage.getItem('articles_pages');
            const cachedPagination = localStorage.getItem('cachedPagination');
            if (cachedPages) {
                this.pages = JSON.parse(cachedPages);
                console.log('Кэш pages загружен из localStorage:', this.pages);
            }
            if (cachedPagination) {
                this.pagination = JSON.parse(cachedPagination);
                console.log('Кэш pagination загружен из localStorage:', this.pagination);
            }
        },

        async loadArticles(page = 1, perPage = 6) {
            // Валидация страницы
            if (page < 1 || (this.pagination.totalPages > 0 && page > this.pagination.totalPages)) {
                console.warn('Некорректный номер страницы:', page, 'totalPages:', this.pagination.totalPages);
                return this.articles;
            }

            // Формируем ключ кэша: perPage_page (например, '6_2' или '4_3')
            const cacheKey = `${perPage}_${page}`;

            // Проверяем кэш
            if (this.pages[cacheKey]) {
                this.articles = this.pages[cacheKey];
                this.pagination.currentPage = page;
                this.pagination.articlesPerPage = perPage;
                console.log('Загружено из кэша:', cacheKey, this.articles);
                return this.articles;
            }

            // Очищаем старый кэш для другого perPage
            this.clearCacheForOtherPerPage(perPage);

            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    params: {
                        page,
                        per_page: perPage
                    }
                });

                console.log('Ответ от бэкенда:', response.data);

                if (!response.data || !response.data.meta || !response.data.data) {
                    throw new Error('Некорректный формат ответа от сервера');
                }

                // Сохраняем статьи
                this.articles = response.data.data;
                this.pages[cacheKey] = response.data.data;

                // Обновляем пагинацию
                this.pagination = {
                    currentPage: response.data.meta.current_page || 1,
                    totalPages: response.data.meta.total_pages || 1,
                    totalArticles: response.data.meta.total || 0,
                    articlesPerPage: response.data.meta.per_page || perPage
                };

                // Сохраняем в localStorage
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));

                // Ограничиваем размер кэша (например, храним до 10 страниц)
                this.limitCacheSize(10);

                console.log('Pagination state:', this.pagination);
                return this.articles;
            } catch (error) {
                this.error = 'Ошибка загрузки статей: ' + error.message;
                console.error('Ошибка загрузки статей:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },

        // Очистка кэша для других perPage
        clearCacheForOtherPerPage(perPage) {
            Object.keys(this.pages).forEach(key => {
                const [cachedPerPage] = key.split('_').map(Number);
                if (cachedPerPage !== perPage) {
                    delete this.pages[key];
                    console.log(`Очищен кэш для perPage=${cachedPerPage}`);
                }
            });
            // Обновляем localStorage после очистки
            localStorage.setItem('articles_pages', JSON.stringify(this.pages));
        },

        // Ограничение размера кэша
        limitCacheSize(maxPages) {
            const keys = Object.keys(this.pages);
            if (keys.length > maxPages) {
                const oldestKeys = keys.slice(0, keys.length - maxPages);
                oldestKeys.forEach(key => {
                    delete this.pages[key];
                    console.log(`Удалён старый кэш:', ${key}`);
                });
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
            }
        },



       /* async loadArticles(page = 1, perPage= 6) {
            // Проверяем кэш для страницы
            if (this.pages[page]) {
                this.articles = this.pages[page];
                this.pagination.currentPage = page;
                console.log('Загружено из кэша:', page, this.articles);
                return this.articles;
            }

            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    params: {
                        page,
                        per_page: perPage,
                    },
                });

                console.log('Ответ от бэкенда:', response.data);

                if (!response.data || !response.data.meta || !response.data.data) {
                    throw new Error('Некорректный формат ответа от сервера');
                }

                // Сохраняем статьи в состояние
                this.articles = response.data.data;

                // Кэшируем данные в Pinia
                this.pages[page] = response.data.data;
                localStorage.setItem('articles_pages', JSON.stringify(this.pages)); // Сохраняем кэш в localStorage

                // Обновляем пагинацию
                this.pagination = {
                    currentPage: response.data.meta.current_page || 1,
                    totalPages: response.data.meta.total_pages || 1,
                    totalArticles: response.data.meta.total || 0,
                    articlesPerPage: response.data.meta.per_page || perPage,
                };

                // Кэшируем пагинацию
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));
                // Сохраняем пагинацию в состояние
                this.pagination.currentPage = response.data.meta.current_page || 1;

                console.log('Pagination state:', this.pagination);

                console.log('Pagination state:', this.pagination);
                return this.articles;
            } catch (error) {
                this.error = 'Ошибка загрузки статей: ' + error.message;
                console.error('Ошибка загрузки статей:', error);
                return [];
            } finally {
                this.loading = false;
            }
        },
*/
        async loadArticleById(id) {
            this.loading = true;
            this.error = null;

            const articleId = Number(id);
            if (isNaN(articleId)) {
                this.error = 'Некорректный ID';
                this.loading = false;
                return;
            }

            // Используем кэш из Pinia
            const cachedArticle = this.cachedArticle[articleId];
            if (cachedArticle) {
                this.article = cachedArticle;
                console.log('Статья загружена из Pinia кэша:', this.article);
                this.loading = false;
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles/${articleId}`);
                this.article = response.data;

                // Кэшируем статью в Pinia
                this.cachedArticle[articleId] = this.article;
                localStorage.setItem('cachedArticles', JSON.stringify(this.cachedArticle));

                console.log('Статья загружена с сервера:', this.article);
            } catch (error) {
                this.error = 'Ошибка загрузки статьи';
                console.error('Ошибка загрузки статьи:', error.message);
                this.article = null;
            } finally {
                this.loading = false;
            }
        },

        async uploadImage(file) {
            this.loading = true;
            this.error = null;
            this.uploadProgress = 0;

            try {
                if (!file || !(file instanceof File)) {
                    throw new Error('Файл не выбран или имеет неверный формат');
                }

                const formData = new FormData();
                formData.append('image', file);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                });

                const imageUrl = response.data.imageUrl;
                if (!imageUrl) {
                    throw new Error('Сервер не вернул URL изображения');
                }

                return { success: true, imageUrl };
            } catch (error) {
                this.error = error.message || 'Ошибка загрузки изображения';
                console.error('Ошибка загрузки изображения:', error);
                return { success: false, error: this.error };
            } finally {
                this.loading = false;
                this.uploadProgress = 0;
            }
        },

        async addArticle(newArticle) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    title: newArticle.title,
                    content: newArticle.content,
                    image: newArticle.image,
                    author: newArticle.author || 'Anonymous'
                });
                // Обновляем кэш и текущую страницу
                if (this.pagination.currentPage === 1) {
                    this.articles.unshift(response.data);
                    this.pages[1] = [...this.articles];
                }
                this.pagination.totalArticles += 1;
                this.pagination.totalPages = Math.ceil(this.pagination.totalArticles / this.pagination.articlesPerPage);
            } catch (error) {
                this.error = 'Ошибка добавления статьи';
                console.error('Ошибка добавления статьи:', error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async editArticle(article) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/articles/${article.id}`, {
                    ...article,
                    author: article.author || 'Anonymous'
                });
                // Обновляем кэш
                for (const page in this.pages) {
                    const index = this.pages[page].findIndex(a => a.id === article.id);
                    if (index !== -1) {
                        this.pages[page][index] = response.data;
                        if (Number(page) === this.pagination.currentPage) {
                            this.articles = [...this.pages[page]];
                        }
                        break;
                    }
                }
                if (this.article && this.article.id === article.id) {
                    this.article = response.data;
                }
            } catch (error) {
                this.error = 'Ошибка редактирования статьи';
                console.error('Ошибка редактирования статьи:', error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteArticle(id) {
            this.loading = true;
            this.error = null;
            try {
                const articleId = Number(id);
                if (!articleId || isNaN(articleId)) {
                    throw new Error('Некорректный ID');
                }
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/articles/${articleId}`);
                // Обновляем кэш
                for (const page in this.pages) {
                    this.pages[page] = this.pages[page].filter(article => article.id !== articleId);
                    if (Number(page) === this.pagination.currentPage) {
                        this.articles = [...this.pages[page]];
                    }
                }
                this.pagination.totalArticles -= 1;
                this.pagination.totalPages = Math.ceil(this.pagination.totalArticles / this.pagination.articlesPerPage);
                if (this.article && this.article.id === articleId) {
                    this.article = null;
                }
            } catch (error) {
                this.error = 'Ошибка удаления статьи';
                console.error('Ошибка удаления статьи:', error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async goToPrevious(currentId, router) {
            const currentIndex = this.articles.findIndex(a => a.id === Number(currentId));

            if (currentIndex === 0 && this.pagination.currentPage > 1) {
                const previousPage = this.pagination.currentPage - 1;

                // Загружаем статьи предыдущей страницы
                await this.loadArticles(previousPage, this.pagination.articlesPerPage);

                // Обновляем текущие статьи из кэша
                this.articles = this.pages[previousPage];
                this.pagination.currentPage = previousPage;

                const previousArticle = this.articles[this.articles.length - 1];
                this.article = previousArticle;
                router.push(`/blog/${previousArticle.id}`);
            } else if (currentIndex > 0) {
                const previousArticle = this.articles[currentIndex - 1];
                this.article = previousArticle;
                router.push(`/blog/${previousArticle.id}`);
            }
        },

        async goToNext(currentId, router) {
            const currentIndex = this.articles.findIndex(a => a.id === Number(currentId));

            if (currentIndex === this.articles.length - 1 && this.pagination.currentPage < this.pagination.totalPages) {
                const nextPage = this.pagination.currentPage + 1;

                // Загружаем статьи следующей страницы
                await this.loadArticles(nextPage, this.pagination.articlesPerPage);

                // Обновляем текущие статьи из кэша
                this.articles = this.pages[nextPage];
                this.pagination.currentPage = nextPage;

                const nextArticle = this.articles[0];
                this.article = nextArticle;
                router.push(`/blog/${nextArticle.id}`);
            } else if (currentIndex < this.articles.length - 1 && currentIndex !== -1) {
                const nextArticle = this.articles[currentIndex + 1];
                this.article = nextArticle;
                router.push(`/blog/${nextArticle.id}`);
            }
        },
    },

    // Переход на первую статью сайта
    goToFirstArticle() {
        // Находим статью с минимальным id (первая статья на сайте)
        const firstArticle = this.articles.reduce((min, article) => article.id < min.id ? article : min, this.articles[0]);

        if (firstArticle) {
            // Переход на первую статью (можно использовать router.push или другой метод перехода)
            console.log('Перехожу к первой статье:', firstArticle.id);
            this.router.push({ name: 'article', params: { id: firstArticle.id } });
        }
    },

    // Переход на последнюю статью сайта
    goToLastArticle() {
        // Находим статью с максимальным id (последняя статья на сайте)
        const lastArticle = this.articles.reduce((max, article) => article.id > max.id ? article : max, this.articles[0]);

        if (lastArticle) {
            // Переход на последнюю статью (можно использовать router.push или другой метод перехода)
            console.log('Перехожу к последней статье:', lastArticle.id);
            this.router.push({ name: 'article', params: { id: lastArticle.id } });
        }
    },

    getters: {
        isFirst: (state) => (id) => {
            const currentIndex = state.articles.findIndex(a => a.id === Number(id));
            return currentIndex === 0 && state.pagination.currentPage === 1;
        },

        isLast: (state) => (id) => {
            const currentIndex = state.articles.findIndex(a => a.id === Number(id));
            return currentIndex === state.articles.length - 1 && state.pagination.currentPage === state.pagination.totalPages;
        },
    }
});