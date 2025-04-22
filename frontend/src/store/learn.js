import { defineStore } from 'pinia';

export const useLearnStore = defineStore('learn', {
    state: () => ({ courses: ['Vue 3 Basics', 'Advanced Vue', 'Pinia State Management'] }),
    actions: {
        addCourse(course) { this.courses.push(course); }
    }
});