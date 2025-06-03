<script setup>
import { ref, onMounted, computed } from 'vue';
import { useArticlesStore } from '@/store/articles';
import {formatDate, getFullImageUrl, BASE_URL, useChangePage} from '@/utils/common';
import {useRoute, useRouter} from 'vue-router';
import Pagination from "@/components/UI/pagination.vue";

const route = useRoute();
const router = useRouter();
const articlesStore = useArticlesStore();
const dialog = ref(false);
const isEditing = ref(false);
const currentArticle = ref({ id: null, title: '', content: '', image_url: '', file: null, fileName: '', imagePreview: null });
const { changePage } = useChangePage(4, '/admin'); // Для админки

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

    articlesStore.loadArticles(page, 4); // Загружаем статьи для текущей страницы
});

const openAddDialog = () => {
  resetForm();
  dialog.value = true;
};

const openEditDialog = (article) => {
  currentArticle.value = { ...article, file: null, fileName: '', imagePreview: getFullImageUrl(article.image_url) };
  isEditing.value = true;
  dialog.value = true;
};

const resetForm = () => {
  if (currentArticle.value.image_url && currentArticle.value.image_url.startsWith('blob:')) {
    URL.revokeObjectURL(currentArticle.value.image_url);
  }
  currentArticle.value = { id: null, title: '', content: '', image_url: '', file: null, fileName: '', imagePreview: null };
  isEditing.value = false;
};

const handleFileChange = (file) => {
  console.log('[COMPONENT] handleFileChange - Input:', file);
  let selectedFile = file;
  if (Array.isArray(file)) {
    selectedFile = file[0];
  } else if (file && !(file instanceof File)) {
    selectedFile = file?.file || null; // Vuetify может отправлять { file: File }
  }
  if (selectedFile instanceof File) {
    currentArticle.value.file = selectedFile;
    currentArticle.value.fileName = selectedFile.name;
    currentArticle.value.imagePreview = URL.createObjectURL(selectedFile);
    currentArticle.value.image_url = null;
    console.log('[COMPONENT] handleFileChange - File selected:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });
  } else {
    console.warn('[COMPONENT] handleFileChange - Invalid file:', selectedFile);
    currentArticle.value.file = null;
    currentArticle.value.fileName = '';
    currentArticle.value.imagePreview = isEditing.value ? getFullImageUrl(currentArticle.value.image_url) : null;
    if (!isEditing.value) {
      currentArticle.value.image_url = null;
    }
  }
};

const saveArticle = async () => {
  try {
    let articleData = { ...currentArticle.value };
    console.log('[COMPONENT] saveArticle - Initial article data:', {
      title: articleData.title,
      content: articleData.content,
      image_url: articleData.image_url,
      file: articleData.file ? { name: articleData.file.name, size: articleData.file.size, type: articleData.file.type } : null,
      imagePreview: articleData.imagePreview
    });

    if (!articleData.title || !articleData.content) {
      throw new Error('Заголовок и контент обязательны');
    }
    if (!articleData.file && !articleData.image_url && !isEditing.value) {
      throw new Error('Изображение обязательно для новой статьи');
    }

    const payload = {
      title: articleData.title,
      content: articleData.content,
      image_url: articleData.file ? null : articleData.image_url,
      file: articleData.file
    };
    console.log('[COMPONENT] saveArticle - Payload to send:', {
      title: payload.title,
      content: payload.content,
      image_url: payload.image_url,
      file: payload.file ? { name: payload.file.name, size: payload.file.size, type: payload.file.type } : null
    });

    if (isEditing.value) {
      payload.id = articleData.id;
      await articlesStore.editArticle(payload);
      await articlesStore.loadArticles(
          articlesStore.pagination.currentPage,
          articlesStore.pagination.articlesPerPage
      );
    } else {
      await articlesStore.addArticle(payload);
      await articlesStore.loadArticles(1, articlesStore.pagination.articlesPerPage || 6);
    }

    resetForm();
    dialog.value = false;
  } catch (error) {
    console.error('[COMPONENT] saveArticle - Error:', error.response?.data || error.message);
    alert('Ошибка при сохранении статьи: ' + (error.response?.data?.error || error.message));
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
                <v-card-text>{{ article.content }}...</v-card-text>
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
      </v-row>
      <!-- Пагинация -->
      <Pagination
          :totalPages="articlesStore.pagination.totalPages"
          :modelValue="articlesStore.pagination.currentPage"
          @update:modelValue="changePage"
      />
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
          <div class="mb-2">
            <v-img v-if="currentArticle.imagePreview" :src="currentArticle.imagePreview" height="100px" class="mb-2"></v-img>
            <div v-if="currentArticle.imagePreview" class="text-caption mb-2">
              <span v-if="currentArticle.file">Выбрано изображение: {{ currentArticle.fileName }}</span>
              <span v-else>Существующее изображение: {{ currentArticle.image_url.split('/').pop() }}</span>
            </div>
          </div>
          <v-file-input
              label="Выберите изображение"
              :model-value="currentArticle.file"
              accept="image/jpeg,image/png"
              @update:model-value="handleFileChange"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialog = false" color="grey">Закрыть</v-btn>
          <v-btn @click="saveArticle" color="primary" :disabled="articlesStore.loading">
            {{ isEditing ? 'Сохранить' : 'Сохранить' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style lang="scss">
.admin {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("/image/admin.jpg");
  background-position: center;
  background-size: cover;

  &__card {
    background-color: color(cream);
  }

}
</style>