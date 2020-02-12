// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import Vuesax from 'vuesax'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/analytics'
import {firebaseConfig} from './helpers/firebaseConfig'
import ImageUploader from 'vue-image-upload-resize'

import 'vuesax/dist/vuesax.css'
import 'material-icons/iconfont/material-icons.css'

import axios from 'axios'
import VueAxios from 'vue-axios'

Vue.config.productionTip = false
Vue.use(Vuesax)
Vue.use(ImageUploader)
Vue.use(VueAxios, axios)

Vue.prototype.$lastUser = null

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
  propData: {
    lastUser: this.$lastUser
  },
  created () {
    firebase.initializeApp(firebaseConfig)
    firebase.analytics()
    const MAIN_THIS = this
    // Обработчик входа/выхода пользователя в аккаунт
    firebase.auth().onAuthStateChanged((user) => {
      // Если есть текущий пользователь
      if (user) {
        // Запоминаем его модель в глобальную переменную
        MAIN_THIS.$lastUser = user
        // Переходим на раздел сайта Search
        MAIN_THIS.$router.push('/')
      } else {
        // Если текущего пользователя нет -
        // зануляем данные о последнем пользователе
        // и переходим на раздел "Home"
        MAIN_THIS.$lastUser = null
        MAIN_THIS.$router.push('/')
      }
    })
  }
})
