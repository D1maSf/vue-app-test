import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        loading: false,
        error: null
    }),

    actions: {
        async register(username, password, recaptcha) {
            this.loading = true;
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`,
                    { username, password, recaptcha});
                this.user = response.data;
                return response.data; // Для сообщения на фронте
            } catch (error) {
                this.error = error.response?.data?.error || 'Ошибка регистрации';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async login(username, password) {
            this.loading = true;
            try {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { username, password });
                this.user = response.data.user;
                this.token = response.data.token;
                localStorage.setItem('token', this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            } catch (error) {
                this.error = error.response?.data?.error || 'Ошибка входа';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        },

        async checkAuth() {
            const token = localStorage.getItem('token');
            if (token) {
                this.token = token;
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`);
                    this.user = {
                        id: response.data.id,
                        username: response.data.username,
                        is_admin: response.data.is_admin
                    };
                    console.log('User after checkAuth:', this.user);
                    this.error = null;
                } catch (error) {
                    console.error('Ошибка проверки авторизации:', error);
                    this.logout();
                }
            }
        },

    }
});