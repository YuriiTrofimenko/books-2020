<template lang="pug">
  div
    vs-row.infinite-wrapper
      vs-col(:key='index' v-for='book,index in books' vs-type='flex' vs-justify='center' vs-align='center' vs-w='3')
        template
          vs-row(vs-justify='center')
            vs-col(type='flex' vs-justify='center' vs-align='center' vs-w='12')
              vs-card.cardx
                div(slot='header')
                  h3
                    | {{book.title}}
                div(slot='media')
                  img(v-if='book.image' :src='book.image')
                  img(v-if='!book.image' src='../assets/logo.png')
                div
                  span
                    | {{book.description}}
                div(slot='footer')
                  vs-row(vs-justify='flex-end')
                    vs-button(type='gradient' color='danger' icon='favorite')
                    vs-button(color='primary' icon='turned_in_not')
                    vs-button(color='rgb(230,230,230)' color-text='rgb(50,50,50)' icon='settings')
      infinite-loading(@infinite='booksInfiniteHandler' force-use-infinite-wrapper='.infinite-wrapper')
</template>

<script>
import InfiniteLoading from 'vue-infinite-loading'
export default {
  name: 'Search',
  components: { InfiniteLoading },
  data () {
    return {
      isBooksListChanged: false
    }
  },
  computed: {
    books () {
      // источник данных о книгах
      return this.$store.getters.books
    }
  },
  watch: {
    // Если изменился список
    books (newVal, oldVal) {
      this.isBooksListChanged = true
    }
  },
  created () {
    this.$store.dispatch('clearBooks')
      .then(() => {
        if (this.books.length !== 0) {
          this.books.length = 0
        }
      })
      .catch(err => {
        console.log(err)
      })
  },
  methods: {
    booksInfiniteHandler ($state) {
      this.$store.dispatch('loadBooks')
        .then(() => {
          // console.log('isBooksListChanged', this.isBooksListChanged)
          if (this.isBooksListChanged) {
            console.log('$state.loaded()')
            $state.loaded()
          } else {
            // $state.complete()
            if (this.$store.getters.currentBooksOwner === -1) {
              console.log('$state.complete()')
              $state.complete()
            } else {
              console.log('$state.loaded()2')
              $state.loaded()
            }
          }
          this.isBooksListChanged = false
        })
        .catch(err => {
          console.log(err)
        })
    }
  }
}
</script>

<style scoped lang="stylus">
  img
    max-height 300px
    max-width 100%
  .infinite-wrapper
    overflow scroll
    height 800px
</style>
