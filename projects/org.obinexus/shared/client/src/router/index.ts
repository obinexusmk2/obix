import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App
    },
    {
      path: '/projects/automaton',
      name: 'automaton',
      component: App
    },
    {
      path: '/projects/textflow',
      name: 'textflow',
      component: App
    },
    {
      path: '/projects/collatz',
      name: 'collatz',
      component: App
    }
  ]
})

export default router
