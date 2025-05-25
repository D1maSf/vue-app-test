<script setup>
import { ref, computed, watch } from 'vue';
import {useAuth, useSocialIcons, useBaseLinks} from "@/utils/common.js";

const { navLinks } = useBaseLinks();
const { socialIcons } = useSocialIcons();
const { isAuthenticated, currentUsername } = useAuth();

</script>

<template>
  <footer class="footer text-center d-flex flex-column ga-2 py-4">
    <v-container>
      <v-row>
        <v-toolbar-items class="flex-wrap ga-4">
          <v-btn class="py-2 scale-on-hover" v-for="link in navLinks" :key="link.text" :to="link.href">
            {{ link.text }}
          </v-btn>
        </v-toolbar-items>
        <hr class="hr-pixel d-sm-none">
          <div class="social-icons social-icons--pixel">
            <a
                v-for="(icon, index) in socialIcons"
                :key="index"
                :href="icon.link"
                target="_blank"
                rel="noopener noreferrer"
                :class="'icon-' + icon.name"
                class="social-icons__link"
            >
            </a>
          </div>
        <hr class="hr-pixel">

        <div class="footer__desc">
          Phasellus feugiat arcu sapien, et iaculis ipsum elementum sit amet.
          Mauris cursus commodo interdum. Praesent ut risus eget metus luctus accumsan id ultrices nunc.
          Sed at orci sed massa consectetur dignissim a sit amet dui. Duis commodo vitae velit et faucibus.
          Morbi vehicula lacinia malesuada. Nulla placerat augue vel ipsum ultrices, cursus iaculis dui sollicitudin.
          Vestibulum eu ipsum vel diam elementum tempor vel ut orci. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
        </div>
        <hr class="hr-pixel">
        <div class="footer__info text-center w-100 rounded-lg">
          Все права защищены {{ new Date().getFullYear() }}г.  <div v-if="isAuthenticated" class="name-user text-capitalize">/{{ currentUsername }}

        </div>
          <a class="logo" href="">
            <img src="/image/logo-8bit.png" alt="logo for footer">
          </a>
        </div>
      </v-row>
    </v-container>

  </footer>
</template>

<style lang="scss">

</style>