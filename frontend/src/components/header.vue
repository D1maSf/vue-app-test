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
  isBlogMobileOpen.value = false;
  isMenuOpen.value = false;
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Добавляем "Админ-панель" только для админа
const allNavLinks = computed(() => {
  const links = [...navLinks.value];
  if (authStore.user?.is_admin) {
    links.push({ text: 'Админ-панель', href: '/admin' });
  }
  return links;
});
</script>

<template>

  <v-app-bar class="header">
    <v-container>
      <v-row>
        <a class="logo" href="">
          <img src="/image/logo-8bit.png" alt="logo for header">
        </a>
        <v-card-text v-if="isAuthenticated" class="name-user text-capitalize">
          {{ currentUsername }}
        </v-card-text>
        <v-spacer></v-spacer>

        <v-app-bar-nav-icon @click="toggleMenu" :class="{ 'toggle--open': isMenuOpen }" class="toggle d-md-none scale-on-hover">
            <svg viewBox="0 0 800 600">
              <path d="M300,220 C300,220 520,220 540,220 C740,220 640,540 520,420 C440,340 300,200 300,200"
                    class="top"></path>
              <path d="M300,320 L540,320" class="middle"></path>
              <path d="M300,210 C300,210 520,210 540,210 C740,210 640,530 520,410 C440,330 300,190 300,190"
                    class="bottom" transform="translate(480, 320) scale(1, -1) translate(-480, -318) "></path>
            </svg>
        </v-app-bar-nav-icon>

        <!-- Навигация для десктопа (без подменю) -->
        <v-toolbar-items class="d-none d-md-flex ga-1">
          <v-btn class="py-2 scale-on-hover" v-for="link in allNavLinks" :key="link.text" :to="link.href">
            {{ link.text }}
          </v-btn>
        </v-toolbar-items>

        <!-- Кнопки входа/выхода для десктопа -->
        <v-toolbar-items class="d-none d-md-flex">
          <v-btn class="py-2 scale-on-hover" v-if="!isAuthenticated" to="/auth">Вход / Регистрация</v-btn>
          <v-btn class="py-2 scale-on-hover" v-else @click="logoutHandler">Выйти</v-btn>
        </v-toolbar-items>
      </v-row>
    </v-container>
    <!-- Мобильное меню -->
  </v-app-bar>
  <v-navigation-drawer  class="nav d-md-none" v-model="isMenuOpen" temporary app right>
    <v-list dense>
      <v-list-item
          v-for="link in allNavLinks"
          :key="link.text"
          :to="link.href"
          @click="link.hasSubmenu ? null : (isMenuOpen = false)"
      >
        <v-list-item-title @click="link.hasSubmenu ? toggleBlogMobileMenu() : null">
          {{ link.text }}
        </v-list-item-title>
        <!-- Подменю для блога в мобильном меню -->
        <v-list v-if="link.hasSubmenu && isBlogMobileOpen && articles.length" dense>
          <v-list-item v-for="article in articles" :key="article.id" :to="`/blog/${article.id}`" @click="isMenuOpen = false">
            <v-list-item-title>{{ article.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-list-item>

      <!-- Кнопки входа/выхода для мобильного -->
      <v-list-item v-if="!isAuthenticated" to="/auth" @click="isMenuOpen = false">
        <v-list-item-title>Вход / Регистрация</v-list-item-title>
      </v-list-item>
      <v-list-item v-else @click="logoutHandler">
        <v-list-item-title>Выйти</v-list-item-title>
      </v-list-item>
      <div class="social-icons social-icons--pixel">
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
  <div class="topbar">
    <v-container>
      <v-row>
        <div class="social-icons social-icons--pixel mr-auto">
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
      </v-row>
    </v-container>

  </div>


</template>

<style lang="scss">

.v-toolbar-items {
  align-items: center;
}




</style>