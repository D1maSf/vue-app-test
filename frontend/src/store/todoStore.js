import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTodoStore = defineStore('todoStore', () => {
    const todos = ref([]);
    const completedTodos = ref([]);
    const removedTodos = ref([]);

    // Функция для добавления новой задачи
    const addTodo = (text, priority = null) => {
        todos.value.push({
            id: Date.now(),
            text,
            completed: false,
            priority,
        });
        saveTodos();
    };

    // Переключение состояния задачи (выполнена/не выполнена)
    const toggleTodo = (id) => {
        const todo = todos.value.find((todo) => todo.id === id);
        if (todo) {
            if (!todo.completed) {
                if (!completedTodos.value.some((t) => t.id === todo.id)) {
                    completedTodos.value.push(todo);
                }
                todos.value = todos.value.filter((t) => t.id !== id); // Убираем из активных
            } else {
                if (!todos.value.some((t) => t.id === todo.id)) {
                    todos.value.push(todo);
                }
                completedTodos.value = completedTodos.value.filter((t) => t.id !== id); // Убираем из завершённых
            }
            todo.completed = !todo.completed;
            saveTodos();
        }
    };

    // Восстановление задачи из завершённых
    const restoreTodoFromCompleted = (id) => {
        const todo = completedTodos.value.find((todo) => todo.id === id);
        if (todo) {
            todos.value.push(todo);
            completedTodos.value = completedTodos.value.filter((t) => t.id !== id);
            todo.completed = false;
            saveTodos();
        }
    };

    // Восстановление удалённой задачи
    const restoreTodo = (id) => {
        const todo = removedTodos.value.find((todo) => todo.id === id);
        if (todo) {
            todos.value.push(todo);
            removedTodos.value = removedTodos.value.filter((t) => t.id !== id);
            todo.completed = false;
            saveTodos();
        }
    };
// Перемещение задачи из удалённых в завершённые
    const restoreToCompleted = (id) => {
        const todo = removedTodos.value.find((todo) => todo.id === id);
        if (todo && todo.completed) { // Проверяем, завершена ли задача
            // Добавляем задачу в завершённые
            completedTodos.value.push(todo);
            // Убираем задачу из списка удалённых
            removedTodos.value = removedTodos.value.filter((t) => t.id !== id);
            // Сохраняем изменения в localStorage
            saveTodos();
        }
    };
    // Удаление задачи
    const removeTodo = (id) => {
        const todo = todos.value.find((todo) => todo.id === id);
        if (todo) {
            removedTodos.value.push(todo);
            todos.value = todos.value.filter((t) => t.id !== id);
            saveTodos();
        }
    };

    // Перемещение задачи из завершённых в удалённые
    const removeTodoToCompleted = (id) => {
        const todo = completedTodos.value.find((todo) => todo.id === id);
        if (todo) {
            removedTodos.value.push(todo);
            completedTodos.value = completedTodos.value.filter((t) => t.id !== id);
            saveTodos();
        }
    };

    // Полное удаление задачи из списка удалённых
    const removeTodoCompletelyFromRemoved = (id) => {
        // Находим задачу в списке удалённых
        const todoIndex = removedTodos.value.findIndex((todo) => todo.id === id);
        if (todoIndex !== -1) {
            removedTodos.value.splice(todoIndex, 1); // Удаляем задачу полностью
            saveTodos();
        }
    };

    // Полное удаление задачи
    const removeTodoCompletely = (id) => {
        const todo = completedTodos.value.find((todo) => todo.id === id);
        if (todo) {
            completedTodos.value = completedTodos.value.filter((t) => t.id !== id);
            saveTodos();
        }
    };

    // Сохранение задач в localStorage
    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos.value));
        localStorage.setItem('completedTodos', JSON.stringify(completedTodos.value));
        localStorage.setItem('removedTodos', JSON.stringify(removedTodos.value));
    };

    // Загрузка задач из localStorage
    const loadTodos = () => {
        const savedTodos = JSON.parse(localStorage.getItem('todos')) || [];
        const savedCompletedTodos = JSON.parse(localStorage.getItem('completedTodos')) || [];
        const savedRemovedTodos = JSON.parse(localStorage.getItem('removedTodos')) || [];

        todos.value = savedTodos;
        completedTodos.value = savedCompletedTodos;
        removedTodos.value = savedRemovedTodos;
    };

    // Загружаем задачи при инициализации
    loadTodos();

    return {
        todos,
        completedTodos,
        removedTodos,
        addTodo,
        toggleTodo,
        removeTodo,
        restoreTodo,
        restoreTodoFromCompleted,
        removeTodoToCompleted,
        removeTodoCompletely,
        removeTodoCompletelyFromRemoved,
        restoreToCompleted
    };
});