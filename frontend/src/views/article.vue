<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useArticlesStore } from '@/store/articles';
import { useRoute, useRouter } from 'vue-router';
import { formatDate, getFullImageUrl } from '@/utils/common';
import axios from 'axios';

const articlesStore = useArticlesStore();
const route = useRoute();
const router = useRouter();
const loading = ref(true);

const currentId = computed(() => Number(route.params.id));
const article = computed(() => articlesStore.article);

const canGoPrevious = computed(() => {
  if (!article.value || !articlesStore.articles) return false;
  
  const currentIndex = articlesStore.articles.findIndex(a => a.id === article.value.id);
  if (currentIndex === -1) return false;
  
  return currentIndex > 0 || (currentIndex === 0 && articlesStore.pagination.currentPage > 1);
});

const canGoNext = computed(() => {
  if (!article.value || !articlesStore.articles) return false;
  
  const currentIndex = articlesStore.articles.findIndex(a => a.id === article.value.id);
  if (currentIndex === -1) return false;
  
  return currentIndex < articlesStore.articles.length - 1 || (currentIndex === articlesStore.articles.length - 1 && articlesStore.pagination.currentPage < articlesStore.pagination.totalPages);
});

const loadPageForArticle = async (id) => {
  if (!id || isNaN(id)) return;

  const { articlesPerPage } = articlesStore.pagination;
  
  // Загружаем статьи первой страницы
  await articlesStore.loadArticles(1, articlesPerPage);
  
  // Загружаем конкретную статью
  await articlesStore.loadArticleById(id);
};

const goToPrevious = async () => {
  if (article.value && article.value.id) {
    await articlesStore.loadArticles(1, articlesStore.pagination.articlesPerPage);
    const currentIndex = articlesStore.articles.findIndex(a => a.id === article.value.id);
    
    if (currentIndex > 0) {
      const previousArticle = articlesStore.articles[currentIndex - 1];
      router.push(`/blog/${previousArticle.id}`);
    } else if (currentIndex === 0 && articlesStore.pagination.currentPage > 1) {
      // Если это первая статья на странице и есть предыдущая страница
      const previousPage = articlesStore.pagination.currentPage - 1;
      await articlesStore.loadArticles(previousPage, articlesStore.pagination.articlesPerPage);
      const lastArticle = articlesStore.articles[articlesStore.articles.length - 1];
      router.push(`/blog/${lastArticle.id}`);
    }
  }
};

const goToNext = async () => {
  if (article.value && article.value.id) {
    await articlesStore.loadArticles(1, articlesStore.pagination.articlesPerPage);
    const currentIndex = articlesStore.articles.findIndex(a => a.id === article.value.id);
    
    if (currentIndex < articlesStore.articles.length - 1) {
      const nextArticle = articlesStore.articles[currentIndex + 1];
      router.push(`/blog/${nextArticle.id}`);
    } else if (currentIndex === articlesStore.articles.length - 1 && articlesStore.pagination.currentPage < articlesStore.pagination.totalPages) {
      // Если это последняя статья на странице и есть следующая страница
      const nextPage = articlesStore.pagination.currentPage + 1;
      await articlesStore.loadArticles(nextPage, articlesStore.pagination.articlesPerPage);
      const firstArticle = articlesStore.articles[0];
      router.push(`/blog/${firstArticle.id}`);
    }
  }
};

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
        <v-card>
          <v-card-title class="text-h4 mb-4">{{ article.title }}</v-card-title>
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
            <div v-html="article.content" class="article-content"></div>
          </v-card-text>
          
          <v-card-actions class="d-flex justify-space-between flex-wrap">
            <router-link to="/blog" class="btn btn--link">← Назад к блогу</router-link>
            <div class="d-flex justify-space-between ga-3">
              <v-btn @click="goToPrevious" color="primary" :disabled="!canGoPrevious.value">
                <v-icon icon="mdi-chevron-left" class="mr-1"></v-icon>
                Предыдущая
              </v-btn>
              <v-btn @click="goToNext" color="primary" :disabled="!canGoNext.value">
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