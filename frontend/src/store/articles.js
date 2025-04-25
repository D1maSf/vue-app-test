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
            articlesPerPage: 6
        }
    }),
    
    // Инициализируем store при создании
    setup() {
        const store = this;
        store.articles = [];
        return store;
    },

    actions: {

        clearCache() {
            localStorage.removeItem('articles_pages');
            localStorage.removeItem('cachedArticles');
            localStorage.removeItem('cachedPagination');
            this.pages = {};
            this.cachedArticle = {};
            this.pagination = {
                currentPage: 1,
                totalPages: 1,
                totalArticles: 0,
                articlesPerPage: 6
            };
            this.articles = [];
            console.log('Кэш очищен');
        },

        loadCachePagesBlog() {
            // Загружаем кэшированные страницы
            const cachedPages = JSON.parse(localStorage.getItem('articles_pages'));
            if (cachedPages && typeof cachedPages === 'object') {
                this.pages = cachedPages;
            }

            // Загружаем кэшированную пагинацию
            const cachedPagination = JSON.parse(localStorage.getItem('cachedPagination'));
            if (cachedPagination && typeof cachedPagination === 'object') {
                this.pagination = cachedPagination;
            }
        },

        loadCacheArticle() {
            // Загружаем кэшированные статьи
            const cachedArticles = JSON.parse(localStorage.getItem('cachedArticles'));
            if (cachedArticles && typeof cachedArticles === 'object') {
                this.cachedArticle = cachedArticles;
            }

        },


        // Загружаем кэш из localStorage при инициализации
        initializeCache() {
            // Инициализируем articles массивом
            this.articles = [];
            
            const cachedPages = localStorage.getItem('articles_pages');
            const cachedPagination = localStorage.getItem('cachedPagination');
            if (cachedPages) {
                this.pages = JSON.parse(cachedPages);
                // Инициализируем articles из кэша первой страницы
                const page1 = this.pages[1];
                if (page1) {
                    this.articles = [...page1];
                }
            }
            if (cachedPagination) {
                this.pagination = JSON.parse(cachedPagination);
            }
        },

        loadCache() {
            const cachedPages = localStorage.getItem('articles_pages');
            const cachedPagination = localStorage.getItem('cachedPagination');

            if (cachedPages) {
                try {
                    const pages = JSON.parse(cachedPages);
                    this.pages = pages;
                } catch (error) {
                    console.error('Ошибка при загрузке кэша:', error);
                }
            }

            if (cachedPagination) {
                try {
                    const pagination = JSON.parse(cachedPagination);
                    this.pagination = pagination;
                } catch (error) {
                    console.error('Ошибка при загрузке pagination:', error);
                }
            }

            // Проверяем, есть ли данные в кэше
            const cacheKey = `${this.pagination.articlesPerPage}_${this.pagination.currentPage}`;
            if (this.pages[cacheKey]) {
                this.articles = this.pages[cacheKey].data.data;
            } else {
                console.log('Данных в кэше нет');
            }
        },

        async loadArticles(page = 1, perPage = 6) {
            const cacheKey = `${perPage}_${page}`;
            
            // Проверяем кэш для страницы
            if (this.pages[cacheKey]) {
                // Обновляем данные из кэша
                this.articles = this.pages[cacheKey].data.data;
                this.pagination.currentPage = page;
                this.pagination.totalArticles = this.pages[cacheKey].meta.total;
                this.pagination.totalPages = this.pages[cacheKey].meta.total_pages;
                this.pagination.articlesPerPage = this.pages[cacheKey].meta.per_page;
                
                return this.articles;
            }

            // Если нет данных в кэше, загружаем с бэкенда
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    params: {
                        page,
                        per_page: perPage,
                    },
                });

                if (!response.data || !response.data.data) {
                    throw new Error('Некорректный формат ответа от сервера');
                }

                // Сохраняем статьи в состоянии
                this.articles = response.data.data.data;

                // Обновляем пагинацию
                this.pagination = {
                    currentPage: response.data.data.meta.current_page || 1,
                    totalPages: response.data.data.meta.total_pages || 1,
                    totalArticles: response.data.data.meta.total || 0,
                    articlesPerPage: response.data.data.meta.per_page || perPage,
                };

                // Кэшируем данные
                this.pages[cacheKey] = {
                    data: response.data.data,
                    meta: response.data.data.meta
                };
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));

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
                });
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
            }
        },


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
                this.loading = false;
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles/${articleId}`);
                this.article = response.data;

                // Кэшируем статью в Pinia
                this.cachedArticle[articleId] = this.article;
                localStorage.setItem('cachedArticles', JSON.stringify(this.cachedArticle));
            } catch (error) {
                this.error = 'Ошибка загрузки статьи';
                console.error('Ошибка загрузки статьи:', error.message);
                this.article = null;
            } finally {
                this.loading = false;
            }
        },

        async uploadImage(file) {
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                });

                // Возвращаем объект с правильным полем imageUrl
                return { imageUrl: response.data.url };
            } catch (error) {
                console.error('Ошибка загрузки изображения:', error);
                throw new Error(`Ошибка загрузки изображения: ${error.message}`);
            }
        },

        async addArticle(newArticle) {
            this.loading = true;
            this.error = null;
            try {
                // Формируем FormData для отправки файла
                const formData = new FormData();
                formData.append('title', newArticle.title);
                formData.append('content', newArticle.content);
                formData.append('image', newArticle.file);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                // Сначала добавляем статью в текущий список
                const article = response.data;
                this.articles.unshift(article);

                // Затем обновляем кэш
                if (this.pagination.currentPage === 1) {
                    // Если первая страница, обновляем кэш первой страницы
                    if (!this.pages[1]) {
                        this.pages[1] = [];
                    }
                    this.pages[1] = [article, ...this.pages[1]];
                }

                // Обновляем пагинацию
                this.pagination.totalArticles += 1;
                this.pagination.totalPages = Math.ceil(this.pagination.totalArticles / this.pagination.articlesPerPage);

                // Сохраняем обновленный кэш
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));
            } catch (error) {
                this.error = 'Ошибка добавления статьи: ' + error.message;
                console.error('Ошибка добавления статьи:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async editArticle(article) {
            this.loading = true;
            this.error = null;
            try {
                const formData = new FormData();
                formData.append('title', article.title);
                formData.append('content', article.content);
                if (article.file) {
                    formData.append('image', article.file);
                } else if (article.image_url) {
                    formData.append('image_url', article.image_url);
                }

                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/articles/${article.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
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
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/articles/${id}`);
                // Обновляем кэш
                for (const page in this.pages) {
                    this.pages[page] = this.pages[page].filter(article => article.id !== id);
                    if (Number(page) === this.pagination.currentPage) {
                        this.articles = [...this.pages[page]];
                    }
                }
                this.pagination.totalArticles -= 1;
                this.pagination.totalPages = Math.ceil(this.pagination.totalArticles / this.pagination.articlesPerPage);
                if (this.article && this.article.id === id) {
                    this.article = null;
                }
            } catch (error) {
                this.error = 'Ошибка удаления статьи: ' + error.message;
                console.error('Ошибка удаления статьи:', error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async goToPrevious(currentId, router) {
            // Загружаем статьи текущей страницы
            await this.loadArticles(this.pagination.currentPage, this.pagination.articlesPerPage);
            
            const currentIndex = this.articles.findIndex(a => a.id === Number(currentId));
            
            if (currentIndex === 0 && this.pagination.currentPage > 1) {
                // Если это первая статья на странице и есть предыдущая страница
                const previousPage = this.pagination.currentPage - 1;
                await this.loadArticles(previousPage, this.pagination.articlesPerPage);
                const lastArticle = this.articles[this.articles.length - 1];
                router.push(`/blog/${lastArticle.id}`);
            } else if (currentIndex > 0) {
                // Если это не первая статья на странице
                const previousArticle = this.articles[currentIndex - 1];
                router.push(`/blog/${previousArticle.id}`);
            }
        },

        async goToNext(currentId, router) {
            // Загружаем статьи текущей страницы
            await this.loadArticles(this.pagination.currentPage, this.pagination.articlesPerPage);
            
            const currentIndex = this.articles.findIndex(a => a.id === Number(currentId));
            
            if (currentIndex === this.articles.length - 1 && this.pagination.currentPage < this.pagination.totalPages) {
                // Если это последняя статья на странице и есть следующая страница
                const nextPage = this.pagination.currentPage + 1;
                await this.loadArticles(nextPage, this.pagination.articlesPerPage);
                const firstArticle = this.articles[0];
                router.push(`/blog/${firstArticle.id}`);
            } else if (currentIndex < this.articles.length - 1) {
                // Если это не последняя статья на странице
                const nextArticle = this.articles[currentIndex + 1];
                router.push(`/blog/${nextArticle.id}`);
            }
        },
        
        clearAllCache() {
            localStorage.removeItem('articles_pages');
            localStorage.removeItem('cachedPagination');
            localStorage.removeItem('cachedArticles');
            
            Object.keys(this.pages).forEach(key => {
                delete this.pages[key];
            });
            
            this.pages = {};
            
            this.pagination = {
                currentPage: 1,
                totalPages: 1,
                totalArticles: 0,
                articlesPerPage: 6
            };
            
            this.articles = [];
            
            setTimeout(() => {
                location.reload();
            }, 100);
        },

    },

    // Переход на первую статью сайта
    goToFirstArticle() {
        // Находим статью с минимальным id (первая статья на сайте)
        const firstArticle = this.articles.reduce((min, article) => article.id < min.id ? article : min, this.articles[0]);

        if (firstArticle) {
            // Переход на первую статью (можно использовать router.push или другой метод перехода)
            this.router.push({ name: 'article', params: { id: firstArticle.id } });
        }
    },

    // Переход на последнюю статью сайта
    goToLastArticle() {
        // Находим статью с максимальным id (последняя статья на сайте)
        const lastArticle = this.articles.reduce((max, article) => article.id > max.id ? article : max, this.articles[0]);

        if (lastArticle) {
            // Переход на последнюю статью (можно использовать router.push или другой метод перехода)
            this.router.push({ name: 'article', params: { id: lastArticle.id } });
        }
    },

    getters: {
        getCurrentArticles: (state) => {
            const cacheKey = `${state.pagination.articlesPerPage}_${state.pagination.currentPage}`;
            const articles = state.pages[cacheKey]?.data?.data || []; // Получаем данные из data.data
            return articles;
        },
        
        isFirst: (state) => {
            return state.pagination.currentPage === 1;
        },
        isLast: (state) => {
            return state.pagination.currentPage === state.pagination.totalPages;
        }
    }
});