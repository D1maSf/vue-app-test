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

const loadPageForArticle = async (id) => {
  if (!id || isNaN(id)) return;

  const { articlesPerPage } = articlesStore.pagination;

  // Проверяем, если статья уже есть на текущих страницах
  for (const [page, articles] of Object.entries(articlesStore.pages)) {
    const foundArticle = articles.find(article => article.id === id);
    if (foundArticle) {
      // Если статья уже есть на странице, загружаем её
      articlesStore.articles = articles;
      articlesStore.pagination.currentPage = Number(page);
      console.log('Загружена статья из кэша для страницы', page, foundArticle);
      return;
    }
  }

  try {
    // Запрашиваем страницу, на которой находится статья
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/articles`, {
      params: { id, per_page: articlesPerPage }
    });

    const page = response.data.meta?.page_for_id;

    if (!page || page < 1) {
      console.warn('Некорректный номер страницы от сервера для ID:', id);
      return;
    }

    await articlesStore.loadArticles(page, articlesPerPage);
    articlesStore.articles = articlesStore.pages[page];
    articlesStore.pagination.currentPage = page;
  } catch (error) {
    console.error('Ошибка при загрузке страницы по ID:', error);
  }
};

const goToPrevious = async () => {
  await articlesStore.goToPrevious(currentId.value, router);
};

const goToNext = async () => {
  await articlesStore.goToNext(currentId.value, router);
};

onMounted(async () => {
  await articlesStore.loadCacheArticle();
  await loadPageForArticle(currentId.value);
  await articlesStore.loadArticleById(currentId.value);
  loading.value = false;
});

watch(
    () => route.params.id,
    async (newId) => {
      loading.value = true;
      await loadPageForArticle(Number(newId));
      await articlesStore.loadArticleById(Number(newId));
      loading.value = false;
    }
);
</script>

<template>
  <v-container>
    <v-row justify="center" v-if="article && !loading">
      <v-col cols="12" sm="8" md="7">
        <v-card>
          <h1>{{ article.title }}</h1>
          <div class="article-meta">
            <v-card-text class="published-date pa-1">
              Опубликовано: {{ formatDate(article.published_date) }}
            </v-card-text>
            <v-card-text class="author">Автор: {{ article.author }}</v-card-text>
          </div>
          <v-img
              v-if="article.image"
              :src="getFullImageUrl(article.image)"
              :alt="article.title"
              class="article-image"
          />
          <v-card-text class="pa-1">
            <p>{{ article.content || 'Содержание статьи отсутствует.' }}</p>
          </v-card-text>
          <v-card-actions class="d-flex justify-space-between flex-wrap">
            <router-link to="/blog" class="btn btn--link">← Назад к блогу</router-link>
            <div class="d-flex justify-space-between ga-3">
              <v-btn
                  @click="goToPrevious()"
                  :disabled="articlesStore.isFirst(currentId)"
                  outlined
                  class="btn btn--default"
              >
                Предыдущая
              </v-btn>
              <v-btn
                  @click="goToNext()"
                  :disabled="articlesStore.isLast(currentId)"
                  outlined
                  class="btn btn--default"
              >
                Следующая
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center" v-else-if="!loading">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Статья не найдена или произошла ошибка при загрузке</v-card-title>
          <v-card-actions>
            <router-link to="/blog" class="text-body-1">← Назад к блогу</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center" v-if="loading">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Загрузка статьи...</v-card-title>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.article-image {
  max-width: 100%;
  height: auto;
  margin: 20px 0;
}

.article-meta {
  font-size: 14px;
  color: gray;
  margin-bottom: 10px;
}

.published-date {
  margin-right: 15px;
}

.author {
  font-weight: bold;
}
</style>