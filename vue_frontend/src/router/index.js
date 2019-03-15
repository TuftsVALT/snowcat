import Vue from 'vue'
import Router from 'vue-router'
import BaseComponent from '@/components/BaseComponent'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'BaseComponent',
      component: BaseComponent
    }
  ]
})
