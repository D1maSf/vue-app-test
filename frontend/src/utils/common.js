import {useAuthStore} from "@/store/auth.js";
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from 'vue-router';
import {useArticlesStore} from '@/store/articles';

//функция форматирования даты
export const formatDate = (date) =>
    new Date(date).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

//базовый урл
export const BASE_URL = `${import.meta.env.VITE_API_URL}`;

//получение полного урл изображения
export const getFullImageUrl = (imagePath) => {
        return imagePath ? `${BASE_URL}${imagePath}` : '';
};

//получение имени пользователя
export function useAuth() {
        const authStore = useAuthStore();

        // Проверяем, авторизован ли пользователь
        const isAuthenticated = computed(() => !!authStore.user);
        // Имя текущего пользователя
        const currentUsername = computed(() => authStore.user?.username || '');

        return {
                isAuthenticated,
                currentUsername,
        };
}

// Базовые ссылки
export function useBaseLinks() {
        const navLinks = ref([
                { text: 'Главная', href: '/' },
                { text: 'О нас', href: '/about' },
                { text: 'Блог', href: '/blog', hasSubmenu: true },
        ]);

        return { navLinks };
}


//иконки соц-сетей
export function useSocialIcons() {
        const socialIcons = ref([
                { name: 'instagram', link: 'https://www.instagram.com' },
                { name: 'telegram', link: 'https://telegram.org' },
                { name: 'vk', link: 'https://vk.com' },
                { name: 'github', link: 'https://github.com' },
                { name: 'youtube', link: 'https://www.youtube.com' },
        ]);

        return { socialIcons };
}
export function useChangePage(perPage, baseRoute = '/blog') {
        const articlesStore = useArticlesStore();
        const router = useRouter();
        const route = useRoute();

        const loadInitialData = async () => {
                const page = parseInt(route.query.page) || 1;
                await articlesStore.loadArticles(page, perPage);
        };

        onMounted(async () => {
                articlesStore.initializeCache();
                await loadInitialData();
        });

        watch(
            () => route.query.page,
            async (newPage) => {
                    const page = parseInt(newPage) || 1;
                    if (page !== articlesStore.pagination.currentPage) {
                            await articlesStore.loadArticles(page, perPage);
                    }
            }
        );

        const changePage = async (page) => {
                const pageNum = parseInt(page) || 1;

                if (pageNum < 1 || pageNum > articlesStore.pagination.totalPages) {
                        console.warn('Некорректный номер страницы:', page);
                        return;
                }

                if (pageNum !== articlesStore.pagination.currentPage) {
                        try {
                                await articlesStore.loadArticles(pageNum, perPage);
                                if (pageNum === 1) {
                                        router.push({ path: baseRoute }); // без query-параметра
                                } else {
                                        router.push({ path: baseRoute, query: { page: pageNum } });
                                }
                        } catch (error) {
                                console.error('Ошибка при загрузке страницы:', error);
                        }
                }
        };

        return { changePage };
}