import {useAuthStore} from "@/store/auth.js";
import {computed, onMounted, ref} from "vue";
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
                { text: 'Обучение', href: '/learn' },
                { text: 'Todo', href: '/todoList' },
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

// Обработчик изменения страницы
export function useChangePage(perPage) {
        const articlesStore = useArticlesStore();
        const router = useRouter();
        const route = useRoute();

        // Инициализируем кэш при монтировании
        onMounted(async () => {
                articlesStore.initializeCache();
                const page = parseInt(route.query.page) || 1;
                await articlesStore.loadArticles(page, perPage);
        });

        // Обработчик смены страницы
        const changePage = async (page) => {
                if (page < 1 || page > articlesStore.pagination.totalPages) {
                        console.warn('Некорректный номер страницы:', page);
                        return;
                }
                if (page !== articlesStore.pagination.currentPage) {
                        try {
                                await articlesStore.loadArticles(page, perPage);
                                router.push({ query: { page } });
                        } catch (error) {
                                console.error('Ошибка при загрузке страницы:', error);
                        }
                }
        };

        return { changePage };
}