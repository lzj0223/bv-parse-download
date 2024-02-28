import { createRouter, createWebHashHistory } from 'vue-router'
import IndexView from '../views/IndexView.vue'

const baseUrl = import.meta.env.BASE_URL.replace('.', '')
const router = createRouter({
  history: createWebHashHistory(baseUrl),
  routes: [
    {
      path: '/',
      name: 'index',
      component: IndexView
    },
  ]
})


export default router
