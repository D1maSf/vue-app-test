import { defineStore } from 'pinia';

export const useHeroStore = defineStore('heroStore', () => {
    const textMap = {
        home: {
            heroText: 'Добро пожаловать!',
            description: 'Это главная страница нашего сайта, где вы найдёте всё самое интересное!',
        },
        blog: {
            heroText: 'Блог',
            description: 'Читайте наши последние статьи и новости в блоге.',
        },
        about: {
            heroText: 'О нас',
            description: 'Узнайте больше о нашей команде и миссии.',
        },
        learn: {
            heroText: 'Обучение',
            description: 'Узнайте больше о разработке вместе с нами',
        },
        todo: {
            heroText: 'Задачник',
            description: 'Создавайте задачи и совершенствуйтесь в их выполнении',
        },
    };

    // Универсальный геттер
    function getContent(routeName, key, fallback = '') {
        return textMap[routeName]?.[key] || fallback;
    }

    return {
        getContent,
    };
});