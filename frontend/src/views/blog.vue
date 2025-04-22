<script setup>
import {useArticlesStore} from '@/store/articles';
import {onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {formatDate, getFullImageUrl, useChangePage} from '@/utils/common';
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
});

</script>

<template>
  <Hero/>
  <div class="blog__content">
    <v-container>
      <v-row>
        <v-col v-for="article in articlesStore.articles" :key="article.id" cols="12" sm="6" lg="4">
          <v-card @click="$router.push(`/blog/${article.id}`)" class="card">
            <v-img :src="getFullImageUrl(article.image)" height="200px" cover></v-img>
            <v-card-title>{{ article.title }}</v-card-title>
            <v-card-text>Опубликовано: {{ formatDate(article.published_date) }}</v-card-text>
            <v-card-text>Автор: {{ article.author }}</v-card-text>
            <v-card-text>{{ article.content }}...</v-card-text>
            <v-card-actions>
              <v-btn class="btn btn--default" @click.stop="$router.push(`/blog/${article.id}`)">
                Читать дальше
              </v-btn>
            </v-card-actions>
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
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1)), url("/image/hero.png");
  background-position: center;
  background-size: cover;

  .hero {
    @media #{$lg} {
      background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url("/image/hero.png");
      background-position: center;
      background-size: cover;
    }
  }
}
</style>