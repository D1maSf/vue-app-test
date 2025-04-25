<script setup>
import { ref } from 'vue';
import { useTodoStore } from '@/store/todoStore';
import Hero from '@/components/hero.vue'

const store = useTodoStore();
const newTodo = ref('');
const newPriority = ref('');
const currentTab = ref('newTask'); // Теперь начальная вкладка "Новое задание"

const addTask = () => {
  if (newTodo.value.trim()) {
    store.addTodo(newTodo.value, newPriority.value || null);
    newTodo.value = '';
    newPriority.value = '';
  }
};

// Методы для кнопок восстановления и удаления
const restoreTodo = (id) => {
  store.restoreTodoFromCompleted(id);
};

const moveToRemoved = (id) => {
  store.removeTodoToCompleted(id);
};

const deleteCompletely = (id) => {
  store.removeTodoCompletely(id);
};

// Новый метод для удаления задачи навсегда из удалённых задач
const deleteCompletelyFromRemoved = (id) => {
  store.removeTodoCompletelyFromRemoved(id); // Используем новый метод
};

const restoreToCompleted = (id) => {
  store.restoreToCompleted(id); // Вызовите метод для перемещения в завершённые
};
</script>

<template>
  <Hero/>
  <div class="todo-container">
    <h2>To-Do List</h2>

    <!-- Вкладки -->
    <div class="tabs">
      <button :class="{ active: currentTab === 'newTask' }" @click="currentTab = 'newTask'">Новое задание</button>
      <button :class="{ active: currentTab === 'active' }" @click="currentTab = 'active'">Активные задачи</button>
      <button :class="{ active: currentTab === 'completed' }" @click="currentTab = 'completed'">Завершённые задачи</button>
      <button :class="{ active: currentTab === 'removed' }" @click="currentTab = 'removed'">Удалённые задачи</button>
    </div>

    <!-- Вкладка с новым заданием -->
    <div v-if="currentTab === 'newTask'" class="section">
      <h3>Добавить новое задание</h3>
      <div class="input-group">
        <input v-model="newTodo" @keyup.enter="addTask" placeholder="Новая задача..." />
        <select v-model="newPriority">
          <option value="">Без приоритета</option>
          <option value="high">🔴 Высокий</option>
          <option value="medium">🟡 Средний</option>
          <option value="low">🟢 Низкий</option>
        </select>
        <button @click="addTask">Добавить</button>
      </div>
    </div>

    <!-- Вкладка с активными задачами -->
    <div v-if="currentTab === 'active'" class="section">
      <h3>Активные задачи</h3>
      <ul>
        <li v-for="todo in store.todos" :key="todo.id" :class="['todo-item', todo.priority, { completed: todo.completed }]">
          <span>{{ todo.text }}</span>
          <button @click="store.toggleTodo(todo.id)" :disabled="todo.completed">Завершить</button>
          <button @click="store.removeTodo(todo.id)">❌</button>
        </li>
      </ul>
    </div>

    <!-- Вкладка с завершёнными задачами -->
    <div v-if="currentTab === 'completed'" class="section">
      <h3>Завершённые задачи</h3>
      <ul>
        <li v-for="todo in store.completedTodos" :key="todo.id" :class="['todo-item', todo.priority, { completed: todo.completed }]">
          <input v-if="todo.completed" type="checkbox" :checked="todo.completed" disabled />
          <span>{{ todo.text }}</span>
          <button @click="restoreTodo(todo.id)">Восстановить</button>
          <button @click="moveToRemoved(todo.id)">Переместить в удалённые</button>
          <button @click="deleteCompletely(todo.id)">Удалить навсегда</button>
        </li>
      </ul>
    </div>

    <!-- Вкладка с удалёнными задачами -->
    <div v-if="currentTab === 'removed'" class="section">
      <h3>Удалённые задачи</h3>
      <ul>
        <li v-for="todo in store.removedTodos" :key="todo.id" :class="['todo-item', todo.priority, { completed: todo.completed }]">
          <input v-if="todo.completed" type="checkbox" :checked="todo.completed" disabled />
          <span>{{ todo.text }} </span><div class="deleted-label">(Удалено)</div>
          <button @click="store.restoreTodo(todo.id)">Восстановить</button>
          <button v-if="todo.completed" @click="restoreToCompleted(todo.id)">Вернуть в завершённые</button>
          <button @click="deleteCompletelyFromRemoved(todo.id)">Удалить навсегда</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
.todo {
  background-image: url("/image/todo.webp");
  background-position: center;
  background-size: cover;

}

.todo-container {
  max-width: 1100px;
  margin: auto;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input, select, button {
  padding: 5px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.completed span {
  text-decoration: line-through;
  color: gray;
}



/* Стили для кнопок вкладок */
.tabs {
  display: flex;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px;
  cursor: pointer;
  border: none;
  background-color: #ddd;
  color: #333;
  font-size: 16px;
  margin-right: 10px;
  border-radius: 5px;
}

.tabs button.active {
  background-color: #4caf50;
  color: white;
}

button {
  padding: 5px;
  border: none;
  background-color: #f44336;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #d32f2f;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Стили для чекбокса */
input[type="checkbox"] {
  margin-right: 10px;
}

/* Пометка для удалённых задач */
.deleted-label {
  color: red;
  font-style: italic;
  margin-left: 10px;
  text-decoration: none;
}
</style>