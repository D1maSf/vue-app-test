<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/header.vue';
import Footer from '@/components/footer.vue';

const route = useRoute();
const mainClass = computed(() => {
  return route.name; // 'home' или 'blog'
});


</script>

<template>
  <v-app>
    <Header />
    <v-main :class="mainClass">
      <router-view></router-view>
    </v-main>
    <Footer />
  </v-app>
</template>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
html {
  font-family: 'Press Start 2P', cursive !important;
}
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
