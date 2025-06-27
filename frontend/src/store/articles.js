import { defineStore } from 'pinia';
import axios from 'axios';

export const useArticlesStore = defineStore('articles', {
    state: () => ({
        articles: [],
        article: null,
        pages: {},         // Кэш страниц: { '6_1': { data, meta }, ... }
        cachedArticle: {}, // Кэш статей по id
        loading: false,
        error: null,
        uploadProgress: 0,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalArticles: 0,
            articlesPerPage: 6,
        },
        originPage: null,
    }),

    persist: {
        key: 'articles_store',
        storage: localStorage,
        paths: ['pages', 'cachedArticle', 'pagination'],
        // храним только ключевые данные — кэш страниц, статей и пагинацию
    },

    actions: {
        setOriginPage(page) {
            this.originPage = page;
        },

        clearAllCache() {
            this.pages = {};
            this.cachedArticle = {};
            this.pagination = {
                currentPage: 1,
                totalPages: 1,
                totalArticles: 0,
                articlesPerPage: 6,
            };
            this.articles = [];
        },

        async loadArticles(page = 1, perPage = 6) {
            const cacheKey = `${perPage}_${page}`;

            if (this.pages[cacheKey]) {
                this.articles = [...this.pages[cacheKey].data.data];
                this.pagination = { ...this.pagination, currentPage: page, ...this.pages[cacheKey].meta };
                return this.articles;
            }

            this.loading = true;
            this.error = null;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
                    params: { page, per_page: perPage },
                });

                if (!response.data || !response.data.data) throw new Error('Некорректный формат ответа');

                this.articles = [...response.data.data];
                this.pagination = {
                    currentPage: response.data.meta.current_page || 1,
                    totalPages: response.data.meta.total_pages || 1,
                    totalArticles: response.data.meta.total || 0,
                    articlesPerPage: response.data.meta.per_page || perPage,
                };

                this.pages[cacheKey] = {
                    data: response.data,
                    meta: response.data.meta,
                };

                return this.articles;
            } catch (error) {
                this.error = 'Ошибка загрузки статей: ' + error.message;
                console.error(error);
                return [];
            } finally {
                this.loading = false;
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

            if (this.cachedArticle[articleId]) {
                this.article = { ...this.cachedArticle[articleId] };
                this.loading = false;
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles/${articleId}`);
                const articleData = response.data;

                this.article = {
                    ...articleData,
                    image_url: articleData.image_url || '/images/default.png',
                    imagePreview: articleData.image_url ? `${import.meta.env.VITE_API_URL}${articleData.image_url}` : null,
                };

                this.cachedArticle[articleId] = { ...this.article };
            } catch (error) {
                this.error = 'Ошибка загрузки статьи';
                console.error(error);
                this.article = null;
            } finally {
                this.loading = false;
            }
        },

        async addArticle(articleData) {
            this.loading = true;
            this.error = null;

            try {
                if (!articleData.title || !articleData.content)
                    throw new Error('Заголовок и контент обязательны');

                if (!articleData.file && !articleData.image_url)
                    throw new Error('Изображение или image_url обязательны');

                const formData = new FormData();
                formData.append('title', articleData.title);
                formData.append('content', articleData.content);

                if (articleData.file) {
                    formData.append('image', articleData.file);
                } else if (articleData.image_url) {
                    formData.append('image_url', articleData.image_url);
                }

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/articles`, formData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });

                this.clearPageCache(this.pagination.currentPage, this.pagination.articlesPerPage);

                // Обновляем кэш для первой страницы
                await this.loadArticles(1, this.pagination.articlesPerPage);
                return response.data.data.article;
            } catch (error) {
                this.error = 'Ошибка добавления статьи: ' + (error.response?.data?.error || error.message);
                console.error(error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async editArticle(article) {
            this.loading = true;

            try {
                const formData = new FormData();
                formData.append('title', article.title);
                formData.append('content', article.content);
                if (article.image_url) formData.append('image_url', article.image_url);
                if (article.file) formData.append('image', article.file);

                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/articles/${article.id}`, formData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });

                this.clearPageCache(this.pagination.currentPage, this.pagination.articlesPerPage);
                await this.loadArticles(this.pagination.currentPage, this.pagination.articlesPerPage);

                return response.data.data.article;
            } catch (error) {
                console.error(error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        clearPageCache(page, perPage) {
            const cacheKey = `${perPage}_${page}`;
            if (this.pages[cacheKey]) {
                delete this.pages[cacheKey];
            }
        },

        async deleteArticle(id) {
            this.loading = true;
            this.error = null;

            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/articles/${id}`);

                // Удаляем статью из всех кэшей страниц
                for (const key in this.pages) {
                    if (this.pages[key]?.data?.data) {
                        this.pages[key].data.data = this.pages[key].data.data.filter((a) => a.id !== id);

                        if (this.pages[key].meta) {
                            this.pages[key].meta.total -= 1;
                            this.pages[key].meta.total_pages = Math.ceil(
                                this.pages[key].meta.total / this.pages[key].meta.per_page
                            );
                        }

                        const [perPage, page] = key.split('_').map(Number);
                        if (page === this.pagination.currentPage && perPage === this.pagination.articlesPerPage) {
                            this.articles = [...this.pages[key].data.data];
                        }
                    }
                }

                this.pagination.totalArticles -= 1;
                this.pagination.totalPages = Math.ceil(
                    this.pagination.totalArticles / this.pagination.articlesPerPage
                );

                if (this.article?.id === id) this.article = null;
                this.clearPageCache(this.pagination.currentPage, this.pagination.articlesPerPage);
                await this.loadArticles(this.pagination.currentPage, this.pagination.articlesPerPage);
            } catch (error) {
                this.error = 'Ошибка удаления статьи: ' + error.message;
                console.error(error);
                throw error;
            } finally {
                this.loading = false;
            }
        },
    },

    getters: {
        getCurrentArticles: (state) => {
            const cacheKey = `${state.pagination.articlesPerPage}_${state.pagination.currentPage}`;
            return state.pages[cacheKey]?.data?.data || state.articles;
        },
    },
});