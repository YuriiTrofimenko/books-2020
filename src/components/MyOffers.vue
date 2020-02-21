<template lang="pug">
  div
    vs-prompt(@cancel='cancel' @accept='acceptAlert' @close='close' :is-valid="validTitle && validType && validAuthor && validDesription && validCountry && validCity" :active.sync='activeAddBookPrompt')
      div
        | Book Description
        vs-input(placeholder='title' label='название книги' v-model='currentBook.title')
        vs-select(label='type' v-model='currentBook.type')
          vs-select-item(:key='index' :value='typeOption.value' :text='typeOption.text' v-for='typeOption, index in typeOptions')
        vs-input(placeholder='author' label='автор' v-model='currentBook.author')
        vs-input(placeholder='country' label='страна' v-model='currentBook.country')
        vs-input(placeholder='city' :disabled='!validCountry' label='город' v-model='currentBook.city')
        vs-textarea(label='описание книги' v-model='currentBook.description' counter='100' :counter-danger.sync='currentBook.counterDanger')
        .preview
          vue-cropper(ref='cropper' :aspect-ratio='1' :viewMode='3' :src='selectedImage' preview='.preview')
        image-uploader(:debug='1' :maxWidth='300' :maxHeight='300' :quality='0.9' :autoRotate='true' :preview='false' :className="['fileinput', { 'fileinput--loaded' : selectedImage }]" :capture='false' accept='image/*' doNotResize="['gif', 'svg']" @input='setImage' @onUpload='startImageResize' @onComplete='endImageResize')
          label(for='fileInput' slot='upload-label')
            figure
              svg(xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewbox='0 0 32 32')
                path.path1(d='M9.5 19c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5-2.91-6.5-6.5-6.5-6.5 2.91-6.5 6.5zM30 8h-7c-0.5-2-1-4-3-4h-8c-2 0-2.5 2-3 4h-7c-1.1 0-2 0.9-2 2v18c0 1.1 0.9 2 2 2h28c1.1 0 2-0.9 2-2v-18c0-1.1-0.9-2-2-2zM16 27.875c-4.902 0-8.875-3.973-8.875-8.875s3.973-8.875 8.875-8.875c4.902 0 8.875 3.973 8.875 8.875s-3.973 8.875-8.875 8.875zM30 14h-4v-2h4v2z')
            span.upload-caption {{ selectedImage ? &apos;Replace&apos; : &apos;Upload&apos; }}
        vs-alert(:active='!validTitle || !validType || !validAuthor || !validCountry || !validCity' color='danger' icon='new_releases')
          | Все поля должны быть заполнены
    vs-row
      vs-col(vs-type='flex' vs-justify='center' vs-align='left' vs-w='6')
        h1 MyOffers
      vs-col(vs-type='flex' vs-justify='center' vs-align='right' vs-w='6')
        vs-tooltip(text='Add book')
          span
            vs-icon(icon='add' size='medium' color='white' bg='rgb(70, 150, 0)' @click='activeAddBookPrompt = true')
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
      infinite-loading(@infinite='myBooksInfiniteHandler' force-use-infinite-wrapper='.infinite-wrapper')
</template>

<script>
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import InfiniteLoading from 'vue-infinite-loading'
export default {
  name: 'MyOffers',
  components: { VueCropper, InfiniteLoading },
  data () {
    return {
      activeAddBookPrompt: false,
      currentBook: {
        title: '',
        type: null,
        author: '',
        description: '',
        counterDanger: false,
        country: '',
        city: '',
        image: ''
      },
      typeOptions: [
        {text: 'дарю', value: 1},
        {text: 'дам почитать', value: 2}
      ],
      isBooksListChanged: false
    }
  },
  computed: {
    books () {
      // источник данных о моих книгах
      return this.$store.getters.myBooks
    },
    validTitle () {
      return (this.currentBook.title.length > 0)
    },
    validType () {
      return (this.currentBook.type !== null)
    },
    validAuthor () {
      return (this.currentBook.author.length > 0)
    },
    validDesription () {
      return (this.currentBook.description.length <= 100)
    },
    validCountry () {
      return (this.currentBook.country.length > 0)
    },
    validCity () {
      return (this.currentBook.city.length > 0)
    },
    selectedImage () {
      return this.currentBook.image
    }
  },
  watch: {
    // Если изменился список
    books (newVal, oldVal) {
      console.log(oldVal, newVal)
      this.isBooksListChanged = true
    }
  },
  created () {
    // console.log('created')
    if (this.books.length !== 0) {
      this.books.length = 0
    }
  },
  methods: {
    acceptAlert (color) {
      this.$store.dispatch('newBook', {
        title: this.currentBook.title,
        author: this.currentBook.author,
        description: this.currentBook.description,
        country: this.currentBook.country,
        city: this.currentBook.city,
        type: this.currentBook.type,
        image: this.currentBook.image,
        active: ''
      })
        .then(() => {
          for (const key in this.currentBook) {
            if (this.currentBook.hasOwnProperty(key)) {
              this.currentBook[key] = ''
            }
          }
          this.$vs.notify({
            color: 'success',
            title: 'Book Created',
            text: `Book "${this.currentBook.title}" Created`
          })
          this.submitStatus = 'OK'
          // console.log(this.submitStatus)
        })
        .catch(err => {
          this.submitStatus = err.message
          console.log(this.submitStatus)
        })
    },
    close () {
      this.$vs.notify({
        color: 'danger',
        title: 'Closed',
        text: 'You close a dialog!'
      })
    },
    cancel () {
      this.currentBook.title = ''
      this.currentBook.type = null
      this.currentBook.author = ''
      this.currentBook.description = ''
    },
    setImage (base64Image) {
      this.currentBook.image = base64Image
      // console.log(this.currentBook.image)
    },
    startImageResize () {
      console.log('startImageResize')
    },
    endImageResize () {
      console.log('endImageResize')
      // this.$refs.cropper.setCanvasData({ left: 0, top: 0, height: 220, width: 140 })
    },
    myBooksInfiniteHandler ($state) {
      this.$store.dispatch('loadMyBooks')
        .then(() => {
          console.log('isBooksListChanged', this.isBooksListChanged)
          if (this.isBooksListChanged) {
            console.log('$state.loaded()')
            $state.loaded()
          } else {
            console.log('$state.complete()')
            $state.complete()
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
  .preview
    max-height 300px
  input[type=file]
    width 0px
    height 0px
    position absolute
    z-index -1
    overflow hidden
    opacity 0
  .infinite-wrapper
    overflow scroll
    height 800px
    // width 140px
  // .vs-tooltip
    // z-index 20000
    // display block
</style>
