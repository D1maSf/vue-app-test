<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useArticlesStore } from '@/store/articles';
import { useRoute, useRouter } from 'vue-router';
import { formatDate, getFullImageUrl } from '@/utils/common';
import axios from 'axios';
import {id} from "vuetify/locale";

const articlesStore = useArticlesStore();
const route = useRoute();
const router = useRouter();
const loading = ref(true);

const currentId = computed(() => Number(route.params.id));
const article = computed(() => articlesStore.article);

const currentIndex = computed(() => {
  if (!article.value || !articlesStore.articles.length) return -1;
  return articlesStore.articles.findIndex(a => a.id === article.value.id);
});

const canGoPrevious = computed(() => {
  if (currentIndex.value === -1) return false;
  // Если статья не первая на странице или есть предыдущие страницы
  return currentIndex.value > 0 || articlesStore.pagination.currentPage > 1;
});

const canGoNext = computed(() => {
  if (currentIndex.value === -1) return false;
  // Если статья не последняя на странице или есть следующие страницы
  return currentIndex.value < articlesStore.articles.length - 1 || articlesStore.pagination.currentPage < articlesStore.pagination.totalPages;
});

const loadPageForArticle = async (id) => {
  if (!id || isNaN(id)) return;
  console.log('id:', id);
  const { articlesPerPage } = articlesStore.pagination;

  try {
    console.log(`Запрос к: /api/articles/page-of/${id}?per_page=${articlesPerPage}`);
    console.log('🟡 articlesPerPage:', articlesPerPage);

    const apiBase = import.meta.env.DEV ? 'http://localhost:3000' : ''; // если деплой будет через Nginx
    const response = await axios.get(`${apiBase}/api/articles/page-of/${id}?per_page=${articlesPerPage}`);
    console.log('Full response:', response);
    console.log(' response data:', response.data);
    const page = response.data.page;
    console.log('Page:', page);
    articlesStore.setOriginPage(page); // 👈 сохранить страницу

    await articlesStore.loadArticles(page, articlesPerPage);
    await articlesStore.loadArticleById(id);
  } catch (error) {
    console.error('Ошибка при загрузке номера страницы для статьи:', error);
    if (error.response) {
      console.error('Ответ с ошибкой от сервера:', error.response.status, error.response.data);
    } else {
      console.error('Ошибка вне ответа сервера:', error.message);
    }
  }
};

const goToPrevious = async () => {
  if (!article.value?.id) return;

  const { articles, pagination } = articlesStore;
  const idx = articles.findIndex(a => a.id === article.value.id);

  if (idx > 0) {
    const prevArticle = articles[idx - 1];
    await router.push(`/blog/${prevArticle.id}`);
    return;
  }

  if (pagination.currentPage > 1) {
    const prevPage = pagination.currentPage - 1;
    await articlesStore.loadArticles(prevPage, pagination.articlesPerPage);
    // Загрузить статью последней на новой странице (последняя статья предыдущей страницы)
    if (articlesStore.articles.length) {
      const lastArticle = articlesStore.articles[articlesStore.articles.length - 1];
      await articlesStore.loadArticleById(lastArticle.id);  // Обязательно обновляем текущую статью в сторе
      await router.push(`/blog/${lastArticle.id}`);
    }
  }
};

const goToNext = async () => {
  if (!article.value?.id) return;

  const { articles, pagination } = articlesStore;
  const idx = articles.findIndex(a => a.id === article.value.id);

  if (idx < articles.length - 1) {
    const nextArticle = articles[idx + 1];
    await router.push(`/blog/${nextArticle.id}`);
    return;
  }

  if (pagination.currentPage < pagination.totalPages) {
    const nextPage = pagination.currentPage + 1;
    await articlesStore.loadArticles(nextPage, pagination.articlesPerPage);
    // Загрузить статью первой на новой странице
    if (articlesStore.articles.length) {
      const firstArticle = articlesStore.articles[0];
      await articlesStore.loadArticleById(firstArticle.id);  // Обновляем текущую статью
      await router.push(`/blog/${firstArticle.id}`);
    }
  }
};

function goBack() {
  const page = articlesStore.originPage ?? 1;
  router.push(`/blog?page=${page}`);
}

onMounted(async () => {
  await articlesStore.loadCacheArticle();
  await loadPageForArticle(currentId.value);
  loading.value = false;
});

watch(
    () => route.params.id,
    async (newId) => {
      if (newId) {
        loading.value = true;
        await loadPageForArticle(Number(newId));
        loading.value = false;
      }
    }
);
</script>

<template>
  <v-container>
    <v-row justify="center" v-if="article && !loading">
      <v-col cols="12" sm="8" md="7">
        <v-card class="card">
          <h1 class=" mb-4">{{ article.title }}</h1>
          <v-card-subtitle class="mb-4">
            <div class="d-flex align-center">
              <v-icon icon="mdi-account" class="mr-2"></v-icon>
              <span>Автор: {{ article.author_name }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
              <span>Опубликовано: {{ formatDate(article.created_at) }}</span>
            </div>
          </v-card-subtitle>

          <v-img
              v-if="article.image_url"
              :src="getFullImageUrl(article.image_url)"
              :alt="article.title"
              class="article-image"
              height="400"
              cover
          />

          <v-card-text class="pa-1">
            <p v-html="article.content" class="article-content"></p>
          </v-card-text>

          <v-card-actions class="d-flex justify-space-between flex-wrap">
            <router-link to="/blog" class="btn btn--link">← Назад к блогу</router-link>
            <v-btn @click="goBack">Назад</v-btn>

            <div class="d-flex justify-space-between ga-3">
              <v-btn @click="goToPrevious" color="primary" :disabled="!canGoPrevious"  :loading="loading">
                <v-icon icon="mdi-chevron-left" class="mr-1"></v-icon>
                Предыдущая
              </v-btn>
              <v-btn @click="goToNext" color="primary" :disabled="!canGoNext"  :loading="loading">
                Следующая
                <v-icon icon="mdi-chevron-right" class="ml-1"></v-icon>
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else class="fill-height">
      <v-col class="text-center">
        <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="4"
        ></v-progress-circular>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.article {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("/image/X9PvihJXUDNmsaJpAPJD--0--6soyy.webp");
  background-position: center;
  background-size: cover;
}
.article-content {
  :deep(p) {
    margin-bottom: 1rem;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.article-image {
  border-radius: 4px;
  margin: 16px 0;
}

.btn--link {
  text-decoration: none;
  color: inherit;
}
</style>