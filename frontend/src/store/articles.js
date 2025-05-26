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
        },
        originPage: null, // 👈 страница, с которой открыта статья

    }),
    
    // Инициализируем store при создании
    setup() {
        const store = this;
        store.articles = [];
        return store;
    },

    actions: {
        setOriginPage(page) {
            this.originPage = page;
        },

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

        goToArticle(articleId) {
            articlesStore.setOriginPage(articlesStore.pagination.currentPage);
            router.push(`/article/${articleId}`);
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
                this.articles = [...this.pages[cacheKey].data.data];
            } else {
                console.log('Данных в кэше нет');
            }
        },

        async loadArticles(page = 1, perPage = 6) {
            const cacheKey = `${perPage}_${page}`;
            console.log('Fetching articles with params:', { page, per_page: perPage });

            // Проверяем кэш для страницы
            if (this.pages[cacheKey]) {
                // Обновляем данные из кэша, создавая копию
                this.articles = [...this.pages[cacheKey].data.data];
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

                // Сохраняем статьи в состоянии, создавая копию
                this.articles = [...response.data.data];

                // Обновляем пагинацию
                this.pagination = {
                    currentPage: response.data.meta.current_page || 1,
                    totalPages: response.data.meta.total_pages || 1,
                    totalArticles: response.data.meta.total || 0,
                    articlesPerPage: response.data.meta.per_page || perPage,
                };

                // Кэшируем данные (можно кэшировать исходный объект, если он не мутируется дальше)
                this.pages[cacheKey] = {
                    data: response.data, // response.data.data содержит data и meta
                    meta: response.data.meta
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
                this.article = { ...cachedArticle };
                this.loading = false;
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles/${articleId}`);
                const articleData = response.data;
                
                // Обрабатываем изображение
                this.article = {
                    ...articleData,
                    image_url: articleData.image_url || '/images/default.png', // Используем дефолтное изображение, если нет
                    imagePreview: articleData.image_url ? `${import.meta.env.VITE_API_URL}${articleData.image_url}` : null
                };

                // Кэшируем статью в Pinia
                this.cachedArticle[articleId] = { ...this.article };
                localStorage.setItem('cachedArticles', JSON.stringify(this.cachedArticle));
            } catch (error) {
                this.error = 'Ошибка загрузки статьи';
                console.error('Ошибка загрузки статьи:', error.message);
                this.article = null;
            } finally {
                this.loading = false;
            }
        },

       /* async uploadImage(file) {
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles/upload`, formData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,                    },
                    onUploadProgress: (progressEvent) => {
                        this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    }
                });

                // Проверяем, что в ответе есть URL
                if (!response.data.url) {
                    throw new Error('Сервер не вернул URL изображения');
                }

                // Возвращаем объект с правильным полем image_url
                return { 
                    image_url: response.data.url,
                    url: response.data.url // Также возвращаем url для совместимости с бэкендом
                };
            } catch (error) {
                console.error('Ошибка загрузки изображения:', error);
                throw new Error(`Ошибка загрузки изображения: ${error.message}`);
            }
        },
*/
        async addArticle(articleData) {
            this.loading = true;
            this.error = null;
            try {
                console.log('[STORE] addArticle - Article data received:', {
                    title: articleData.title,
                    content: articleData.content,
                    image_url: articleData.image_url,
                    file: articleData.file ? { name: articleData.file.name, size: articleData.file.size, type: articleData.file.type } : null
                });

                if (!articleData.title || !articleData.content) {
                    throw new Error('Заголовок и контент обязательны');
                }
                if (!articleData.file && !articleData.image_url) {
                    throw new Error('Изображение или image_url обязательны');
                }
                if (articleData.file && !(articleData.file instanceof File)) {
                    throw new Error('Файл изображения невалиден');
                }

                const formData = new FormData();
                formData.append('title', articleData.title || '');
                formData.append('content', articleData.content || '');
                if (articleData.file) {
                    formData.append('image', articleData.file);
                    console.log('[STORE] addArticle - File added to FormData:', {
                        name: articleData.file.name,
                        size: articleData.file.size,
                        type: articleData.file.type
                    });
                } else if (articleData.image_url) {
                    formData.append('image_url', articleData.image_url);
                }

                console.log('[STORE] addArticle - FormData payload:', [...formData.entries()]);
                console.log('[STORE] addArticle - Token:', localStorage.getItem('token'));

                const config = {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    onUploadProgress: (progressEvent) => {
                        console.log('[STORE] addArticle - Upload progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                };

                console.log('[STORE] addArticle - Axios config:', config);

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles`, formData, config);

                console.log('[STORE] addArticle - Response from server:', JSON.parse(JSON.stringify(response.data)));

                const newArticle = response.data.data.article;

                console.log('[STORE] addArticle - New article:', JSON.parse(JSON.stringify(newArticle)));

                // 1. Полностью сбрасываем кэш для первой страницы
                const perPage = this.pagination.articlesPerPage;
                const firstPageKey = `${perPage}_1`;

                // 2. Загружаем свежие данные для первой страницы
                const freshResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    params: { page: 1, per_page: perPage }
                });

                // 3. Обновляем состояние
                this.pages = {
                    [firstPageKey]: {
                        data: { data: freshResponse.data.data },
                        meta: freshResponse.data.meta
                    }
                };

                // 4. Синхронизируем глобальную пагинацию
                this.pagination = {
                    currentPage: 1,
                    articlesPerPage: perPage,
                    totalArticles: freshResponse.data.meta.total,
                    totalPages: freshResponse.data.meta.total_pages
                };

                // 5. Обновляем текущие статьи
                this.articles = [...freshResponse.data.data];


                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));

                console.log('[STORE] addArticle - Updated state:', {
                    articles: JSON.parse(JSON.stringify(this.articles)),
                    pagination: JSON.parse(JSON.stringify(this.pagination))
                });

                return newArticle;
            } catch (error) {
                this.error = 'Ошибка добавления статьи: ' + (error.response?.data?.error || error.message);
                console.error('[STORE] addArticle - Error:', error.response?.data || error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async editArticle(article) {
            this.loading = true;
            console.log('[STORE] editArticle - article received:', JSON.parse(JSON.stringify(article)));
            try {
                console.log(`[STORE] editArticle - Preparing PUT request to /articles/${article.id}`);

                const formData = new FormData();
                formData.append('title', article.title);
                formData.append('content', article.content);
                if (article.image_url) {
                    formData.append('image_url', article.image_url);
                }
                if (article.file) {
                    formData.append('image', article.file);
                }

                console.log('[STORE] editArticle - FormData payload:', [...formData.entries()]);

                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/articles/${article.id}`, formData, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        // Не указываем 'Content-Type', axios установит 'multipart/form-data' автоматически
                    },
                });

                console.log('[STORE] editArticle - Response from server:', JSON.parse(JSON.stringify(response)));

                const updatedArticle = response.data.data.article;
                console.log('[STORE] editArticle - Updated article from response:', JSON.parse(JSON.stringify(updatedArticle)));

                this.clearPageCache(this.pagination.currentPage, this.pagination.articlesPerPage);
                await this.loadArticles(this.pagination.currentPage, this.pagination.articlesPerPage);

                return updatedArticle;
            } catch (error) {
                console.error('[STORE] editArticle - Error:', error.response?.data || error.message);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        clearPageCache(page, perPage) {
            const cacheKey = `${perPage}_${page}`;
            if (this.pages[cacheKey]) {
                delete this.pages[cacheKey];
                this.saveCache();
            }
        },

        async deleteArticle(id) {
            this.loading = true;
            this.error = null;
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/articles/${id}`);
                
                // Обновляем кэш
                for (const cacheKey in this.pages) {
                    // Проверяем, что кэш существует и имеет правильную структуру
                    if (this.pages[cacheKey] && this.pages[cacheKey].data && this.pages[cacheKey].data.data) {
                        // Фильтруем статьи в кэше
                        this.pages[cacheKey].data.data = this.pages[cacheKey].data.data.filter(article => article.id !== id);
                        
                        // Обновляем метаданные
                        if (this.pages[cacheKey].meta) {
                            this.pages[cacheKey].meta.total -= 1;
                            this.pages[cacheKey].meta.total_pages = Math.ceil(this.pages[cacheKey].meta.total / this.pages[cacheKey].meta.per_page);
                        }
                        
                        // Если это текущая страница, обновляем articles
                        const [perPage, page] = cacheKey.split('_').map(Number);
                        if (page === this.pagination.currentPage && perPage === this.pagination.articlesPerPage) {
                            this.articles = [...this.pages[cacheKey].data.data];
                        }
                    }
                }
                
                // Обновляем пагинацию
                this.pagination.totalArticles -= 1;
                this.pagination.totalPages = Math.ceil(this.pagination.totalArticles / this.pagination.articlesPerPage);
                
                // Обновляем localStorage
                localStorage.setItem('articles_pages', JSON.stringify(this.pages));
                localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));
                
                // Если удаляем текущую статью
                if (this.article && this.article.id === id) {
                    this.article = null;
                }
                
                // Проверяем, не осталась ли текущая страница пустой
                if (this.articles.length === 0 && this.pagination.currentPage > 1) {
                    // Переходим на предыдущую страницу
                    await this.loadArticles(this.pagination.currentPage - 1, this.pagination.articlesPerPage);
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

        saveCache() {
            localStorage.setItem('articles_pages', JSON.stringify(this.pages));
            localStorage.setItem('cachedPagination', JSON.stringify(this.pagination));
            localStorage.setItem('cachedArticles', JSON.stringify(this.cachedArticle));
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
            const articles = state.pages[cacheKey]?.data?.data || state.articles;
            // Фиксируем количество статей согласно пагинации
            const perPage = state.pagination.articlesPerPage;
            return articles
        },
        
        isFirst: (state) => {
            return state.pagination.currentPage === 1;
        },
        isLast: (state) => {
            return state.pagination.currentPage === state.pagination.totalPages;
        }
    }
});