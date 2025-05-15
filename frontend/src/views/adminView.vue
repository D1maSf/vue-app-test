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
const currentArticle = ref({ id: null, title: '', content: '', image_url: '', file: null, fileName: '', imagePreview: null });
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

const handleFileChange = (event) => {
  const file = event?.target.files[0];
  if (file) {
    currentArticle.value.file = file;
    currentArticle.value.fileName = file.name;
    // Создаем предварительный URL для отображения изображения
    currentArticle.value.image_url = URL.createObjectURL(file);
    currentArticle.value.imagePreview = URL.createObjectURL(file);
  } else if (isEditing.value && currentArticle.value.image_url) {
    // Если мы в режиме редактирования и у статьи есть URL изображения,
    // используем его для отображения
    currentArticle.value.image_url = getFullImageUrl(currentArticle.value.image_url);
    currentArticle.value.imagePreview = getFullImageUrl(currentArticle.value.image_url);
  }
};

const saveArticle = async () => {
  try {
    let articleData = { ...currentArticle.value };
    console.log('[COMPONENT] saveArticle - Initial article data:', JSON.parse(JSON.stringify(articleData)));

    if (currentArticle.value.file) {
      const uploadResult = await articlesStore.uploadImage(currentArticle.value.file);
      console.log('[COMPONENT] saveArticle - Upload result:', JSON.parse(JSON.stringify(uploadResult)));
      
      if (!uploadResult.image_url) {
        throw new Error(`Ошибка загрузки изображения: ${uploadResult.error || 'Не удалось получить URL изображения'}`);
      }
      articleData.image_url = uploadResult.image_url;
      console.log('[COMPONENT] saveArticle - Article data after upload:', JSON.parse(JSON.stringify(articleData)));
    } else if (!articleData.image_url && !isEditing.value) {
      throw new Error('Изображение обязательно');
    }

    // Сбрасываем файл после загрузки
    currentArticle.value.file = null;

    // Формируем payload для отправки
    const payload = {
      title: articleData.title,
      content: articleData.content,
      image_url: articleData.image_url
    };
    console.log('[COMPONENT] saveArticle - Payload to send:', JSON.parse(JSON.stringify(payload)));

    if (isEditing.value) {
      payload.id = articleData.id;
      await articlesStore.editArticle(payload);
      // Обновляем список статей после успешного обновления
      await articlesStore.loadArticles(
        articlesStore.pagination.currentPage,
        articlesStore.pagination.articlesPerPage
      );
    } else {
      await articlesStore.addArticle(payload);
      // После добавления статьи загружаем первую страницу
      await articlesStore.loadArticles(
        1, 
        articlesStore.pagination.articlesPerPage || 6
      );
    }

    resetForm();
    dialog.value = false;
  } catch (error) {
    console.error('[COMPONENT] saveArticle - Error:', error);
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
          <div class="mb-2">
            <v-img v-if="currentArticle.imagePreview" :src="currentArticle.imagePreview" height="100px" class="mb-2"></v-img>
            <div v-if="currentArticle.imagePreview" class="text-caption mb-2">
              <span v-if="currentArticle.file">Выбрано изображение: {{ currentArticle.fileName }}</span>
              <span v-else>Существующее изображение: {{ currentArticle.image_url.split('/').pop() }}</span>
            </div>
          </div>
          <v-file-input
              label="Выберите изображение"
              @change="handleFileChange"
              accept="image/*"
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
  background-image: url("/image/admin.jpg");
  background-position: center;
  background-size: cover;

  &__card {
    background-color: color(cream);
  }

}
</style>