<script setup>
import { useArticlesStore } from '@/store/articles';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatDate, getFullImageUrl, useChangePage } from '@/utils/common';
import Hero from "@/components/hero.vue";
import Pagination from '@/components/UI/pagination.vue';

const { changePage } = useChangePage(6);
const articlesStore = useArticlesStore();
const route = useRoute();
const router = useRouter();

// Загружаем статьи с пагинацией при монтировании
onMounted(() => {
  articlesStore.loadCachePagesBlog();
  const page = parseInt(route.query.page) || 1;
  articlesStore.loadArticles(page, 6); // Загружаем статьи для текущей страницы
  console.log('Пагинация:', {
    per_page: articlesStore.pagination.articlesPerPage, // Должно быть 6
    total: articlesStore.pagination.totalArticles,      // Должно быть 6
    total_pages: articlesStore.pagination.totalPages   // Должно быть 1
  });
});

// Наблюдаем за изменениями страницы в URL
watch(() => route.query.page, (newPage) => {
  if (newPage) {
    const page = parseInt(newPage);
    if (!isNaN(page)) {
      articlesStore.loadArticles(page, 6);
    }
  }
});
</script>

<template>
  <Hero/>
  <div class="blog__content">
    <v-container>
      <v-row>
        <v-col v-for="article in articlesStore.getCurrentArticles" :key="article.id" cols="12" sm="6" lg="4">
          <v-card @click="$router.push(`/blog/${article.id}`)" class="card">
            <v-img :src="getFullImageUrl(article.image_url)" height="200px" cover></v-img>
            <div class="pa-5">
              <h3 class="card__headline">{{ article.title }}</h3>
              <hr class="hr-pixel">
              <div class="card__created">Опубликовано: {{ formatDate(article.created_at) }}</div>
              <hr class="hr-pixel">
              <div class="card__author">Автор: {{ article.author_name }}</div>
              <hr class="hr-pixel">
              <p class="card__description">{{ article.content }}...</p>
              <hr class="hr-pixel">
              <div class="card__footer mt-5">
                <v-btn class="btn" @click.stop="$router.push(`/blog/${article.id}`)">
                  Читать дальше
                </v-btn>
              </div>
            </div>



          </v-card>
        </v-col>
      </v-row>
      <!-- Пагинация -->
      <Pagination
          :totalPages="articlesStore.pagination.totalPages"
          :modelValue="articlesStore.pagination.currentPage"
          @update:modelValue="changePage"
      />

    </v-container>
  </div>
</template>

<style lang="scss">
.blog {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("/image/2wq.webp");
  background-position: center;
  background-size: cover;
}
</style>