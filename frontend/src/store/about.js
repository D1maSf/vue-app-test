import { defineStore } from 'pinia';

export const useAboutStore = defineStore('about', {
    state: () => ({ aboutText: 'About Page' }),
    actions: {
        updateAboutText(newText) {
            this.aboutText = newText;
        }
    }
});