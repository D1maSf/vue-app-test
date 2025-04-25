<script setup>
import { ref, onMounted } from 'vue';
import { useArticlesStore } from '@/store/articles';
import {formatDate, getFullImageUrl, BASE_URL, useChangePage} from '@/utils/common';
import {useRoute, useRouter} from 'vue-router';
import Pagination from "@/components/UI/pagination.vue";

const route = useRoute();
const router = useRouter();
const articlesStore = useArticlesStore();
const dialog = ref(false);
const isEditing = ref(false);
const currentArticle = ref({ id: null, title: '', content: '', image: '', file: null });
const { changePage } = useChangePage(6);

// Метод для полной очистки кэша
const clearAllCache = () => {
    articlesStore.clearAllCache();
    // Перезагружаем страницу после очистки кэша
    location.reload();
};

// Отслеживаем изменения в store
onMounted(() => {
    // Загружаем статьи
    const page = parseInt(route.query.page) || 1;
    articlesStore.loadArticles(page, 6); // Загружаем статьи для текущей страницы
});

const openAddDialog = () => {
  resetForm();
  dialog.value = true;
};

const openEditDialog = (article) => {
  currentArticle.value = { ...article, file: null };
  isEditing.value = true;
  dialog.value = true;
};

const resetForm = () => {
  if (currentArticle.value.image && currentArticle.value.image.startsWith('blob:')) {
    URL.revokeObjectURL(currentArticle.value.image);
  }
  currentArticle.value = { id: null, title: '', content: '', image: '', file: null };
  isEditing.value = false;
};

const handleFileChange = (event) => {
  const file = event?.target.files[0];
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    currentArticle.value.image = previewUrl;
    currentArticle.value.file = file;
  }
};

const saveArticle = async () => {
  try {
    let articleData = { ...currentArticle.value };

    if (currentArticle.value.file) {
      const uploadResult = await articlesStore.uploadImage(currentArticle.value.file);
      if (!uploadResult.imageUrl) {
        throw new Error(`Ошибка загрузки изображения: ${uploadResult.error || 'Не удалось получить URL изображения'}`);
      }
      articleData.image = uploadResult.imageUrl;
    } else if (!articleData.image) {
      throw new Error('Изображение обязательно');
    }

    // Сбрасываем файл после загрузки
    currentArticle.value.file = null;

    if (isEditing.value) {
      await articlesStore.editArticle(articleData);
    } else {
      await articlesStore.addArticle(articleData);
      // После добавления статьи загружаем первую страницу
      await articlesStore.loadArticles(1, articlesStore.pagination.articlesPerPage);
    }

    resetForm();
    dialog.value = false;
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    alert('Ошибка при сохранении статьи: ' + error.message);
  }
};

const deleteArticle = async (id) => {
  try {
    await articlesStore.deleteArticle(id);
  } catch (error) {
    console.error('Ошибка удаления:', error);
    alert('Ошибка при удалении статьи: ' + error.message);
  }
};

// Обработчик для очистки кэша
</script>

<template>
  <div>
  </div>
  <v-container fluid>
    <div class="d-flex justify-space-between mb-4">
      <v-btn @click="openAddDialog" class="btn btn--light">Добавить статью</v-btn>
      <v-btn @click="clearAllCache" color="red" class="btn btn--light">Очистить кэш</v-btn>
    </div>
    
    <div v-if="articlesStore.getCurrentArticles.length">
      <v-row dense>
        <v-col v-for="article in articlesStore.getCurrentArticles" :key="article.id" cols="12">
          <v-card class="card">
            <v-row no-gutters>
              <v-col cols="12" sm="4">
                <v-img :src="getFullImageUrl(article.image_url)" height="200px" cover></v-img>
              </v-col>
              <v-col cols="12" sm="8">
                <v-card-title>{{ article.title }}</v-card-title>
                <v-card-text>{{ article.content.substring(0, 50) }}...</v-card-text>
                <v-card-text>Опубликовано: {{ formatDate(article.created_at) }}</v-card-text>
                <v-card-text>Автор: {{ article.author_name }}</v-card-text>
                <v-card-actions>
                  <v-btn @click="deleteArticle(article.id)" color="red">Удалить</v-btn>
                  <v-btn @click="openEditDialog(article)" color="orange">Редактировать</v-btn>
                </v-card-actions>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
        
        <!-- Пагинация -->
        <Pagination
            :totalPages="articlesStore.pagination.totalPages"
            :modelValue="articlesStore.pagination.currentPage"
            @update:modelValue="changePage"
        />
      </v-row>
    </div>
    <div v-else class="text-center">
      <v-alert type="info">Нет статей</v-alert>
    </div>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditing ? 'Редактировать статью' : 'Добавить статью' }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="currentArticle.title" label="Заголовок" required></v-text-field>
          <v-textarea v-model="currentArticle.content" label="Контент" required></v-textarea>
          <v-text-field v-model="currentArticle.image" label="Изображение (URL)" required readonly></v-text-field>
          <v-file-input
              label="Выберите изображение"
              @change="handleFileChange"
              accept="image/*"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialog = false" color="grey">Закрыть</v-btn>
          <v-btn @click="saveArticle" color="primary" :disabled="articlesStore.loading">
            {{ isEditing ? 'Сохранить изменения' : 'Сохранить' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style lang="scss">
.admin {
  background-image: url("/image/admin.jpg");
  background-position: center;
  background-size: cover;

  &__card {
    background-color: color(cream);
  }

}
</style>