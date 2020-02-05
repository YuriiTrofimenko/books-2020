import firebase from 'firebase/app'

import Book from './BookModel'

export default ({
  state: {
    // Локальный массив Books
    books: [],
    myBooks: [],
    oldestMyBookKeyRef: null
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
      state.myBooks.unshift({
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
      // console.log(...payload.books)
      state[payload.target].push(...payload.books)
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
    },
    setOldestMyBookKeyRef (state, payload) {
      state.oldestMyBookKeyRef = payload
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
        // console.log(payload)
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
        // console.log(newBook)
        const book = await firebase.database().ref(getters.user.id + '/books').push(newBook)
        const booksCountResponse =
          await firebase.database()
            .ref(getters.user.id + '/booksCount')
            // .orderByKey()
            // .limitToFirst(1)
            .once('value')
        let booksCount = booksCountResponse.val()
        if (!booksCount) {
          firebase.database()
            .ref(getters.user.id + '/booksCount')
            .push({'count': 1})
        } else {
          let arrayOfKeys =
            Object.keys(booksCount)
          booksCount = booksCount[arrayOfKeys[0]]
          console.log(booksCount)
          firebase.database()
            .ref(getters.user.id + '/booksCount/' + arrayOfKeys[0])
            // .orderByKey()
            // .limitToFirst(1)
            .update({'count': ++booksCount.count})
        }
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
        // ***
        if (!getters.oldestMyBookKeyRef) {
          const booksResponse =
            await firebase.database()
              .ref(getters.user.id + '/books')
              .orderByKey()
              .limitToLast(4)
              .once('value')
          // Get value
          const books = booksResponse.val()
          // console.log(books)
          if (books) {
            let arrayOfKeys =
              Object.keys(books)
                .sort()
                .reverse()
            commit('setOldestMyBookKeyRef', arrayOfKeys[arrayOfKeys.length - 1])
            // ***
            // New array
            const booksArray = []
            // Get task key (id)
            arrayOfKeys.forEach(key => {
              const b = books[key]
              // console.log(n)
              booksArray.push(
                new Book(
                  b.title,
                  b.author,
                  b.description,
                  b.country,
                  b.city,
                  b.type,
                  b.image,
                  b.active,
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
        } else {
          const booksCountResponse =
            await firebase.database()
              .ref(getters.user.id + '/booksCount')
              .once('value')
          let booksCount = booksCountResponse.val()
          if (booksCount) {
            let arrayOfCountKeys =
              Object.keys(booksCount)
            booksCount = booksCount[arrayOfCountKeys[0]]
            console.log(booksCount.count, getters.myBooks.length)
            if (booksCount.count > getters.myBooks.length) {
              const booksResponse =
                await firebase.database()
                  .ref(getters.user.id + '/books')
                  .orderByKey()
                  .endAt(getters.oldestMyBookKeyRef)
                  .limitToLast(5)
                  .once('value')
              // Get value
              const books = booksResponse.val()
              if (books) {
                let arrayOfKeys =
                  Object.keys(books)
                    .sort()
                    .reverse()
                    .slice(1)
                commit('setOldestMyBookKeyRef', arrayOfKeys[arrayOfKeys.length - 1])
                // ***
                // New array
                const booksArray = []
                // Get task key (id)
                arrayOfKeys.forEach(key => {
                  const b = books[key]
                  // console.log(n)
                  booksArray.push(
                    new Book(
                      b.title,
                      b.author,
                      b.description,
                      b.country,
                      b.city,
                      b.type,
                      b.image,
                      b.active,
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
            }
          }
        }
        // ***
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
            const b = books[key]
            // console.log(n)
            booksArray.push(
              new Book(
                b.title,
                b.author,
                b.description,
                b.country,
                b.city,
                b.type,
                b.image,
                b.active,
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
    },
    oldestMyBookKeyRef (state) {
      return state.oldestMyBookKeyRef
    }
  }
})
