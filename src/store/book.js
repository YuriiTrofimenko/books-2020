import firebase from 'firebase/app'

import Book from './BookModel'

export default ({
  state: {
    // Локальный массив Books
    books: [],
    myBooks: []
  },
  mutations: {
    newBook (
      state,
      {
        id,
        title,
        author,
        description,
        country,
        city,
        type,
        image,
        active
      }
    ) {
      state.myBooks.push({
        id,
        title,
        author,
        description,
        country,
        city,
        type,
        image,
        active
      })
    },
    loadBooks (state, payload) {
      state[payload.target] = payload.books
    },
    editBook (state, payload) {
      const oldBook = state.myBooks.find(book => book.id === payload.id)
      const newBook = {
        id: oldBook.id,
        title: (payload.title) ? payload.title : oldBook.title,
        author: (payload.author) ? payload.author : oldBook.author,
        description: (payload.description) ? payload.description : oldBook.description,
        country: (payload.country) ? payload.country : oldBook.country,
        city: (payload.city) ? payload.city : oldBook.city,
        type: (payload.type) ? payload.type : oldBook.type,
        image: (payload.image) ? payload.image : oldBook.image,
        active: (payload.active) ? payload.active : oldBook.active
      }
      Object.assign(oldBook, newBook)
    },
    deleteBook (state, payload) {
      const deletedBook = state.myBooks.find(book => book.id === payload.id)
      state.myBooks.splice(state[payload.target].indexOf(deletedBook), 1)
    }
  },
  actions: {
    /* Create a new Book */
    // With BackEnd
    async newBook ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        // Use helped class
        console.log(payload)
        const newBook = new Book(
          payload.title,
          payload.author,
          payload.description,
          payload.country,
          payload.city,
          payload.type,
          payload.image,
          payload.active
        )
        console.log(newBook)
        const book = await firebase.database().ref(getters.user.id + '/books').push(newBook)
        // Send mutation
        commit('newBook', {
          ...newBook,
          id: book.key
        })

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async loadMyBooks ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const booksResponse =
          await firebase.database()
            .ref(getters.user.id + '/books')
            // .orderByChild('user')
            // .equalTo(getters.user.id)
            .once('value')
        // Get value
        const books = booksResponse.val()
        // console.log(books)
        if (books) {
          // New array
          const booksArray = []
          // Get task key (id)
          Object.keys(books).forEach(key => {
            const n = books[key]
            // console.log(n)
            booksArray.push(
              new Book(
                n.title,
                n.type,
                n.description,
                n.access,
                n.status,
                n.dependenciesSatisfied,
                n.radius,
                n.left,
                n.top,
                // n.user,
                key
              )
            )
          })
          const payload = {
            target: 'myBooks',
            books: booksArray
          }
          // Send mutation
          commit('loadBooks', payload)
        }

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async loadBooks ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const booksResponse =
          await firebase.database()
            .ref(getters.user.id + '/books')
            // .orderByChild('user')
            // .equalTo(getters.user.id)
            .once('value')
        // Get value
        const books = booksResponse.val()
        // console.log(books)
        if (books) {
          // New array
          const booksArray = []
          // Get task key (id)
          Object.keys(books).forEach(key => {
            const n = books[key]
            // console.log(n)
            booksArray.push(
              new Book(
                n.title,
                n.type,
                n.description,
                n.access,
                n.status,
                n.dependenciesSatisfied,
                n.radius,
                n.left,
                n.top,
                // n.user,
                key
              )
            )
          })
          const payload = {
            target: 'books',
            books: booksArray
          }
          // Send mutation
          commit('loadBooks', payload)
        }

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async editBook ({commit, getters}, {id, changes}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        // Update data fields
        await firebase.database().ref(getters.user.id + '/books').child(id).update({
          ...changes
        })
        // Send mutation
        commit('editBook', {id, ...changes})

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async deleteBook ({commit, getters}, id) {
      commit('clearError')
      commit('setLoading', true)
      try {
        await firebase.database().ref(getters.user.id + '/books').child(id).remove()
        commit('deleteBook', {id, target: 'books'})
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    }
  },
  getters: {
    books (state) {
      return state.books
    },
    myBooks (state) {
      return state.myBooks
    }
  }
})
