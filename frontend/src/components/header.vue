<script setup>
import { ref, computed, watch } from 'vue';
import { useArticlesStore } from '@/store/articles.js';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth.js';
import {useAuth, useBaseLinks, useSocialIcons } from '@/utils/common.js';

const { isAuthenticated, currentUsername } = useAuth();
const { socialIcons } = useSocialIcons();
const store = useArticlesStore();
const authStore = useAuthStore();
const route = useRoute();
const isBlogMobileOpen = ref(false);
const isMenuOpen = ref(false);
const { navLinks } = useBaseLinks();
const articles = computed(() => store.articles);

// Обработчик выхода с проверкой маршрута
const logoutHandler = () => {
  authStore.logout();
  if (route.path === '/admin') {
    router.push('/auth');
  }
};

const router = useRouter();

watch(() => route.fullPath, () => {
  isMenuOpen.value = false;
  updateHtmlClass();
});


// Функция для обновления класса на <html>
const updateHtmlClass = () => {
  const html = document.documentElement;
  if (isMenuOpen.value) {
    html.classList.add('hidden');
  } else {
    html.classList.remove('hidden');
  }
};

// При клике меняем состояние и обновляем класс
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  updateHtmlClass();
};

// Добавляем "Админ-панель" только для админа
const allNavLinks = computed(() => {
  const links = [...navLinks.value];
  if (authStore.user?.is_admin) {
    links.push({  text: 'Админ-панель', class: 'admin-panel', href: '/admin' });
  }
  return links;
});
</script>

<template>

  <v-app-bar :class="{ 'bg--dark-gray': isMenuOpen }" class="header h-auto">
    <v-container>
      <v-row class="align-center">
        <a class="logo" href="">
          <img src="/image/logo-8bit.png" alt="logo for header">
        </a>
        <div v-if="isAuthenticated" class="name-user text-capitalize">/{{ currentUsername }}
        </div>
        <button @click="toggleMenu" :class="{ 'toggle--open': isMenuOpen }" class="toggle d-lg-none">
            <svg viewBox="0 0 800 600">
              <path d="M300,220 C300,220 520,220 540,220 C740,220 640,540 520,420 C440,340 300,200 300,200"
                    class="top"></path>
              <path d="M300,320 L540,320" class="middle"></path>
              <path d="M300,210 C300,210 520,210 540,210 C740,210 640,530 520,410 C440,330 300,190 300,190"
                    class="bottom" transform="translate(480, 320) scale(1, -1) translate(-480, -318) "></path>
            </svg>
          </button>
        <div class="social-icons social-icons--pixel ma-auto d-none d-lg-flex">
          <a
              v-for="(icon, index) in socialIcons"
              :key="index"
              :href="icon.link"
              target="_blank"
              rel="noopener noreferrer"
              :class="'icon-' + icon.name"
              class="social-icons__link"
          >
          </a>
        </div>
        <!-- Навигация для десктопа (без подменю) -->
        <v-toolbar-items class="d-none d-lg-flex">
          <v-btn class="py-2 btn btn--pixel" v-for="link in allNavLinks" :key="link.text" :to="link.href">
            {{ link.text }}
          </v-btn>
        </v-toolbar-items>

        <!-- Кнопки входа/выхода для десктопа -->
        <v-toolbar-items class="d-none d-lg-flex ml-4">
          <v-btn class="py-2 btn-login btn btn--pixel" v-if="!isAuthenticated" to="/auth">Вход/Регистрация</v-btn>
          <v-btn class="py-2 btn-logout btn btn--pixel" v-else @click="logoutHandler">Выйти</v-btn>
        </v-toolbar-items>
      </v-row>
    </v-container>
    <!-- Мобильное меню -->
  </v-app-bar>
  <v-navigation-drawer  class="nav d-lg-none" v-model="isMenuOpen" temporary app right @update:modelValue="updateHtmlClass"
                        @click:overlay="toggleMenu">
    <v-list dense>

      <v-list-item class="mobile btn btn--pixel"
          v-for="link in allNavLinks"
          :key="link.text"
          :to="link.href"
          @click="link.hasSubmenu ? null : (isMenuOpen = false)"
      >

        <v-list-item-title @click="link.hasSubmenu">
          {{ link.text }}
        </v-list-item-title>

      </v-list-item>
      <!-- Кнопки входа/выхода для мобильного -->
      <v-list-item class="btn-login btn btn--pixel" v-if="!isAuthenticated" to="/auth" @click="isMenuOpen = false">
        <v-list-item-title>Вход / Регистрация</v-list-item-title>
      </v-list-item>
      <v-list-item class="btn-logout btn btn--pixel" v-else @click="logoutHandler">
        <v-list-item-title>Выйти</v-list-item-title>
      </v-list-item>
      <div class="social-icons">
        <a
            v-for="(icon, index) in socialIcons"
            :key="index"
            :href="icon.link"
            target="_blank"
            rel="noopener noreferrer"
            :class="'icon-' + icon.name"
            class="social-icons__link"
        >
        </a>
      </div>
    </v-list>
  </v-navigation-drawer>

</template>

<style lang="scss">
.bg--dark-gray {
  background-color: #323136 !important;

}
.btn-login {
  &:hover {
    color: white !important;
    background-color: green !important;
  }
}

.btn-admin {
  background-color: red !important;
  &:hover {
    background-color: color(warning) !important;
  }
}

.btn-logout {
  &:hover {
    color: white !important;
    background-color: #f00 !important;
  }
}
.hidden {
  @media #{$md} {
    overflow: hidden !important;
  }

}
</style>