<template lang="pug">
  div
    vs-prompt(@cancel='cancel' @accept='acceptAlert' @close='close' :is-valid="validTitle && validType && validAuthor && validDesription && validCountry && validCity" :active.sync='activeAddBookPrompt')
      div
        h5(v-if='selectedBookId') Редактирование описания книги
        h5(v-else) Добавление описания книги
        vs-input(placeholder='title' label='название книги' v-model='currentBook.title')
        vs-select(label='type' v-model='currentBook.type')
          vs-select-item(:key='index' :value='typeOption.value' :text='typeOption.text' v-for='typeOption, index in typeOptions')
        vs-input(placeholder='author' label='автор' v-model='currentBook.author')
        vue-autosuggest(v-model="currentBook.country.name" :suggestions="suggestedCountries" :get-suggestion-value="getCountriesSuggestionValue" :input-props="{id:'autosuggest__input', placeholder:'страна'}" @input='countryInputChange' @selected='countryItemSelected')
          template(slot-scope='{suggestion}')
            span {{suggestion.item.name}}
        vue-autosuggest(v-show='validCountry' v-model="currentBook.city.name" :suggestions="suggestedCities" :get-suggestion-value="getCitiesSuggestionValue" :input-props="{id:'autosuggest__input', placeholder:'город?'}" @input='cityInputChange' @selected='cityItemSelected')
          template(slot-scope='{suggestion}')
            span {{suggestion.item.name}}
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
      vs-col(:key='index' v-for='book,index in books' vs-type='flex' vs-justify='center' vs-align='center' vs-lg='6' vs-sm='6' vs-xs='12')
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
                    vs-button(color='rgb(230,230,230)' color-text='rgb(50,50,50)' icon='edit'  @click='showBookEdit(book.id)')
      infinite-loading(@infinite='myBooksInfiniteHandler' force-use-infinite-wrapper='.infinite-wrapper')
</template>

<script>
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import InfiniteLoading from 'vue-infinite-loading'
import { VueAutosuggest } from 'vue-autosuggest'
export default {
  name: 'MyOffers',
  components: { VueCropper, InfiniteLoading, VueAutosuggest },
  data () {
    return {
      activeAddBookPrompt: false,
      currentBook: {
        title: '',
        type: null,
        author: '',
        description: '',
        counterDanger: false,
        country: {
          id: null,
          name: ''
        },
        city: {
          id: null,
          countryId: null,
          name: ''
        },
        image: ''
      },
      suggestedCountries: [],
      suggestedCities: [],
      typeOptions: [
        {text: 'дарю', value: 1},
        {text: 'дам почитать', value: 2}
      ],
      isBooksListChanged: false,
      infiniteLoadingState: null,
      selectedBookId: null
    }
  },
  computed: {
    books () {
      // источник данных о моих книгах
      return this.$store.getters.myBooks
    },
    countries () {
      return [
        {
          data: this.$store.getters.countries
        }
      ]
    },
    cities () {
      return [
        {
          data: this.$store.getters.cities
        }
      ]
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
      return (this.currentBook.country.name.length > 0)
    },
    validCity () {
      return (this.currentBook.city.name.length > 0)
    },
    selectedImage () {
      return this.currentBook.image
    }
  },
  watch: {
    // Если изменился список
    books (newVal, oldVal) {
      this.isBooksListChanged = true
    },
    countries (newVal, oldVal) {
      this.suggestedCountries = newVal
      if (newVal[0].data.length === 0) {
        this.currentBook.country.id = null
      }
    },
    cities (newVal, oldVal) {
      this.suggestedCities = newVal
      if (newVal[0].data.length === 0) {
        this.currentBook.city.id = null
      }
    }
  },
  created () {
    console.log('created')
    /* this.books.length = 0
    this.$store.dispatch('clearBooks') */
  },
  beforeDestroy () {
    console.log('beforeDestroy')
    if (this.infiniteLoadingState) {
      this.$store.dispatch('clearMyBooks')
    }
  },
  methods: {
    async acceptAlert (color) {
      if (!this.currentBook.country.id) {
        await this.$store.dispatch('newCountry', {
          name: this.currentBook.country.name
        })
          .then(() => {
            this.currentBook.country.id = this.$store.getters.newCountryId
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      }
      if (!this.currentBook.city.id) {
        await this.$store.dispatch('newCity', {
          name: this.currentBook.city.name,
          countryId: this.currentBook.country.id
        })
          .then(() => {
            this.currentBook.city.id = this.$store.getters.newCityId
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      }
      if (!this.selectedBookId) {
        this.$store.dispatch('newBook', {
          title: this.currentBook.title,
          author: this.currentBook.author,
          description: this.currentBook.description,
          country: this.currentBook.country.id,
          city: this.currentBook.city.id,
          type: this.currentBook.type,
          image: this.currentBook.image,
          active: 1
        })
          .then(() => {
            for (const key in this.currentBook) {
              if (this.currentBook.hasOwnProperty(key)) {
                this.currentBook[key] = ''
              }
            }
            this.currentBook.country = {
              id: null,
              name: ''
            }
            this.currentBook.city = {
              id: null,
              name: '',
              countryId: null
            }
            this.$vs.notify({
              color: 'success',
              title: 'Book Created',
              text: `Book "${this.currentBook.title}" Created`
            })
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      } else {
        this.$store.dispatch('editBook', {
          title: this.currentBook.title,
          author: this.currentBook.author,
          description: this.currentBook.description,
          country: this.currentBook.country.id,
          city: this.currentBook.city.id,
          type: this.currentBook.type,
          image: this.currentBook.image,
          active: 1,
          id: this.selectedBookId
        })
          .then(() => {
            for (const key in this.currentBook) {
              if (this.currentBook.hasOwnProperty(key)) {
                this.currentBook[key] = ''
              }
            }
            this.currentBook.country = {
              id: null,
              name: ''
            }
            this.currentBook.city = {
              id: null,
              name: '',
              countryId: null
            }
            this.$vs.notify({
              color: 'success',
              title: 'Book Edited',
              text: `Book "${this.currentBook.title}" was Edited`
            })
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
          .finally(() => {
            this.selectedBookId = null
          })
      }
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
      this.currentBook.country = {
        id: null,
        name: ''
      }
      this.currentBook.city = {
        id: null,
        name: '',
        countryId: null
      }
    },
    setImage (base64Image) {
      this.currentBook.image = base64Image
    },
    startImageResize () {
      console.log('startImageResize')
    },
    endImageResize () {
      console.log('endImageResize')
      // this.$refs.cropper.setCanvasData({ left: 0, top: 0, height: 220, width: 140 })
    },
    myBooksInfiniteHandler ($state) {
      this.infiniteLoadingState = $state
      this.$store.dispatch('loadMyBooks')
        .then(() => {
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
    },
    countryItemSelected (selectedCountry) {
      this.currentBook.country = selectedCountry.item
      this.currentBook.city = {
        id: null,
        name: '',
        countryId: null
      }
      this.$store.dispatch('loadCities', {
        startsWith: '',
        countryId: this.currentBook.country.id
      })
    },
    async countryInputChange (text) {
      this.currentBook.country.id = null
      this.currentBook.city = {
        id: null,
        name: '',
        countryId: null
      }
      await this.$store.dispatch('loadCities', {
        startsWith: text,
        countryId: null
      })
      // your search method
      // now `items` will be showed in the suggestion list
      this.$store.dispatch('loadCountries', {
        startsWith: text
      })
        .then(() => {
          console.log('country suggestions', this.countries)
        })
        .catch(err => {
          console.log(err)
        })
    },
    getCountriesSuggestionValue (suggestion) {
      return suggestion.item.name
    },
    cityItemSelected (selectedCity) {
      this.currentBook.city = selectedCity.item
    },
    cityInputChange (text) {
      this.$store.dispatch('loadCities', {
        startsWith: text,
        countryId: this.currentBook.country.id
      })
        .then(() => {
          console.log('city suggestions', this.cities)
        })
        .catch(err => {
          console.log(err)
        })
    },
    getCitiesSuggestionValue (suggestion) {
      return suggestion.item.name
    },
    showBookEdit (id) {
      this.selectedBookId = id
      console.log(id)
      const editedBook = this.books.find(book => book.id === id)
      console.log(editedBook)
      this.currentBook.title = editedBook.title
      this.currentBook.type = editedBook.type
      this.currentBook.author = editedBook.author
      this.currentBook.description = editedBook.description
      this.currentBook.country.name = editedBook.country
      this.currentBook.city.name = editedBook.city
      this.currentBook.image = editedBook.image
      this.activeAddBookPrompt = true
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
