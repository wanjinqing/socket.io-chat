import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/components/index'

Vue.use(Router)


let router = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index
    }
  ]
})

router.beforeEach((to, from, next) => {
  next();
});

export default router;