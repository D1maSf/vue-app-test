<script setup>
import Hero from "@/components/hero.vue";

import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Регистрируем плагин
gsap.registerPlugin(ScrollTrigger)

const box = ref(null)

onMounted(() => {
  gsap.from(box.value, {
    scrollTrigger: {
      trigger: box.value,
      start: 'top 80%',
      end: 'top 30%',
      toggleActions: 'play none none reverse',
    },
    y: 100,
    opacity: 0,
    duration: 1,
    ease: 'power2.out'
  })
})
</script>

<template>
  <Hero/>
  <section style="height: 150vh; background: #f3f3f3;">
    <div ref="box" class="box">ScrollTrigger работает 🚀</div>
  </section>
  <div class="parallax-container">
  </div>
  <div class="scroll-spacer"></div>
</template>


<style lang="scss">
.parallax {
  background-image: url("/image/todo.webp");
  background-position: center;
  background-size: cover;

}
</style>