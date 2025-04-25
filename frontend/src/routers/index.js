import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth'; // Импортируем хранилище авторизации

// Импорт компонентов
const Home = () => import('../views/home.vue');
const About = () => import('../views/about.vue');
const Parallax = () => import('../views/parallaxContainer.vue');
const Learn = () => import('../views/learn.vue');
const TodoList = () => import('../views/todoList.vue');
const Blog = () => import('../views/blog.vue');
const Article = () => import('../views/article.vue');
const AdminView = () => import('@/views/adminView.vue');
const Auth = () => import('@/views/auth.vue');

const routes = [
    { path: '/', name: 'home', component: Home,  },
    { path: '/about', name: 'about', component: About,  },
    { path: '/learn', name: 'learn', component: Learn,  },
    { path: '/todoList', name: 'todo', component: TodoList,  },
    { path: '/parallaxContainer', name: 'parallax', component: Parallax, },
    { path: '/blog', name: 'blog', component: Blog, },
    { path: '/blog/:id', component: Article, name: 'article', props: true }, // Динамический маршрут для статьи
    {
        path: '/admin',
        component: AdminView,
        name: 'admin',
        meta: { requiresAdmin: true } // Метаданные для защиты маршрута
    },
    { path: '/auth', name: 'auth', component: Auth }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // Если есть сохранённая позиция (например, кнопка "назад") — возвращаем её
        if (savedPosition) {
            return savedPosition;
        }
        // Иначе прокручиваем вверх
        return { top: 0 };
    },
});

// Глобальная проверка перед переходом по маршрутам
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    await authStore.checkAuth();

    if (to.meta.requiresAdmin) {
        if (!authStore.user || !authStore.user.is_admin) {
            next('/auth');
        } else {
            next();
        }
    } else if (to.meta.requiresAuth) {
        if (!authStore.user) {
            next('/auth');
        } else {
            next();
        }
    } else if (to.path === '/auth' && authStore.user) {
        next('/');
    } else {
        next();
    }
});

export default router;