import { defineStore } from 'pinia';

export const useHomeStore = defineStore('home', {
    state: () => ({ message: 'Home Page' }),
    actions: {
        changeMessage() {
            this.message = 'New Message! ' + Math.random().toFixed(2);
        }
    }
});