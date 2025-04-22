<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Number, // Текущая страница
  totalPages: Number, // Общее количество страниц
});

const pages = computed(() => {
  const total = props.totalPages;
  const current = props.modelValue;
  const max = 4; // Максимум видимых страниц

  let start = Math.max(1, current - Math.floor(max / 2));
  let end = Math.min(total, start + max - 1);

  if (end - start < max - 1) {
    start = Math.max(1, end - max + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
</script>

<template>
  <div class="pagination" v-if="totalPages > 1">
    <v-btn
        icon
        :disabled="modelValue === 1"
        @click="$emit('update:modelValue', 1)"
    >
      ←
    </v-btn>

    <v-btn
        v-for="page in pages"
        :key="page"
        :color="page === modelValue ? 'primary' : 'default'"
        @click="$emit('update:modelValue', page)"
        :variant="page === modelValue ? 'flat' : 'text'"
    >
      {{ page }}
    </v-btn>

    <v-btn
        icon
        :disabled="modelValue === totalPages"
        @click="$emit('update:modelValue', totalPages)"
    >
      →
    </v-btn>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}
</style>