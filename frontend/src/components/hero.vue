<script setup>
import {useAuth} from '@/utils/common.js';
import {computed} from "vue";
import { useRoute } from 'vue-router';
import {useHeroStore} from "@/store/hero.js";

const heroStore = useHeroStore();
const { isAuthenticated, currentUsername } = useAuth();
const route = useRoute();

function useHeroContent(key, fallback) {
  return computed(() => heroStore.getContent(route.name, key, fallback));
}
const heroText = useHeroContent('heroText', 'Страница');
const description = useHeroContent('description', 'Описание страницы');

//кнопка только для домашней страницы
const isHomePage = computed(() => route.name === 'home');

</script>

<template>
  <div class="hero">
    <v-container>
        <div class="hero__content">
          <h1 class="hero__headline">{{ heroText || 'Страница' }}</h1>
          <p class="hero__desc">
            {{ description || 'Описание страницы' }}
          </p>
          <div v-if="isAuthenticated" class="name-user name-user--xl text-no-wrap hover--yellow">{{ currentUsername }}</div>
          <router-link
              v-if="isHomePage"
              to="/about"
              class="btn"
          >
            <span>Узнать больше о нас</span></router-link>
        </div>
    </v-container>
  </div>
</template>

<style lang="scss">

</style>