<template lang="pug">
    vs-navbar.nabarx(v-model='activeItem')
      div(slot='title')
        vs-navbar-title
          | Home Library
      vs-navbar-item(
        v-for="(link, index) in linkMenu"
        :key="link.title"
        @click="menuShow = false"
        :index="index"
      )
        router-link.navbar-link(
          :to="`${link.url}`"
        ) {{ link.title }}
      // Статическое формирование пункта меню "Выйти"
      vs-navbar-item(
        v-if="checkUser"
      )
        .examplex
          vs-dropdown
            a.a-icon(href.prevent='')
              img(:src="userData.photo" style="height: 32px; width: 32px; border-radius: 50%")
              vs-icon(icon='expand_more')
            vs-dropdown-menu
              vs-dropdown-item(disabled='')
                |{{userData.name}}
              vs-dropdown-item(disabled='')
                |{{userData.email}}
              vs-dropdown-item(divider='')
                span.navbar-link(@click='signOut') SignOut
</template>
<script>
import firebase from 'firebase'
import store from '../../store'
export default {
  name: 'Header',
  data () {
    return {
      menuShow: false,
      activeItem: 0
    }
  },
  created () {
    // Обработчик событий "пользователь вошел / вышел"
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        store.dispatch('loggedUser', user)
      } else {}
    })
  },
  computed: {
    checkUser () {
      return store.getters.checkUser
    },
    userData () {
      return store.getters.user
    },
    isLoading () {
      return this.$store.getters.loading
    },
    linkMenu () {
      return (this.checkUser) ? [
        { title: 'Home', url: '/', icon: 'mdi-home' },
        { title: 'Search', url: '/search', icon: 'mdi-book-search-outline' },
        { title: 'My Offers', url: '/my-offers', icon: 'mdi-format-list-bulleted' },
        { title: 'Contacts', url: '/contacts', icon: 'mdi-contact-phone-outline' }
      ] : [
        { title: 'Home', url: '/', icon: 'mdi-home' },
        { title: 'Contacts', url: '/contacts', icon: 'mdi-contact-phone-outline' }
      ]
    }
  },
  // Наблюдение за значением route
  watch: {
    $route (to, from) {
      // Если нет текущего пользователя
      // и текущий роут не "Home" || "Contacts"
      if (!this.checkUser && to.name !== 'Home' && to.name !== 'Contacts') {
        // Переадресуем пользователя на раздел "Home"
        this.$router.push('/')
      }
      // Иначе переадресуем на желаемый раздел сайта
    }
  },
  methods: {
    signOut () {
      // Вызываем выход из учетной записи в текущем приложении
      store.dispatch('logoutUser')
        .then(() => {
          this.$router.push('/search')
        })
    }
  }
}
</script>
<style scoped lang="stylus">
  .is-active-item
    font-weight bold
</style>
