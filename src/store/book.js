import firebase from 'firebase/app'

import Book from './BookModel'

export default ({
  state: {
    // Локальный массив Books
    books: [],
    myBooks: [],
    oldestBookId: null,
    oldestMyBookId: null
  },
  mutations: {
    newBook (
      state,
      {
        id,
        updatedAt,
        userId,
        userEmail,
        title,
        author,
        genre,
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
        updatedAt,
        userId,
        userEmail,
        title,
        author,
        genre,
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
      const oldBook = state.myBooks.find(book => book.id === payload.oldId)
      const newBook = {
        id: payload.id,
        updatedAt: payload.updatedAt,
        userId: oldBook.userId,
        userEmail: oldBook.userEmail,
        title: (payload.title) ? payload.title : oldBook.title,
        author: (payload.author) ? payload.author : oldBook.author,
        genre: (payload.genre) ? payload.genre : oldBook.genre,
        description: (payload.description) ? payload.description : oldBook.description,
        country: (payload.country) ? payload.country : oldBook.country,
        city: (payload.city) ? payload.city : oldBook.city,
        type: (payload.type) ? payload.type : oldBook.type,
        image: (payload.image) ? payload.image : oldBook.image,
        active: payload.active
      }
      Object.assign(oldBook, newBook)
    },
    deleteBook (state, payload) {
      const deletedBook = state.myBooks.find(book => book.id === payload.id)
      state.myBooks.splice(state[payload.target].indexOf(deletedBook), 1)
    },
    clearBooks (state) {
      state.books = []
    },
    clearMyBooks (state) {
      state.myBooks = []
    },
    setOldestMyBookId (state, payload) {
      state.oldestMyBookId = payload
    },
    setOldestBookId (state, payload) {
      state.oldestBookId = payload
    }
  },
  actions: {
    /* Create a new Book */
    // With BackEnd
    async newBook ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        let newBookData = {
          'title': payload.title,
          'author': payload.author,
          'genre': '',
          'description': payload.description,
          'countryId': payload.country,
          'cityId': payload.city,
          'typeId': payload.type,
          'image': payload.image,
          'active': payload.active ? 1 : 0,
          'userId': getters.user.id,
          'userEmail': getters.user.email,
          'id': null,
          'updatedAt': null
        }
        const url = getters.baseRestApiUrl + '?controller=book&action=create'
        const requestData = {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(newBookData)
        }
        const request = new Request(url, requestData)
        await fetch(request).then(function (response) {
          return response.json()
        }).then(function (response) {
          if (response.data) {
            // Send mutation
            commit('newBook', {
              ...response.data
            })
          }
        }).catch(function (e) {
          console.log(e)
        })
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    // Загрузка собственных книг пользователя
    async loadMyBooks ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        let filterData = {
          'userId': getters.user.id
        }
        if (getters.oldestMyBookId) {
          filterData.lastId = getters.oldestMyBookId
        }
        const url = getters.baseRestApiUrl + '?controller=book&action=filter'
        const requestData = {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(filterData)
        }
        const request = new Request(url, requestData)
        await fetch(request).then(function (response) {
          return response.json()
        }).then(function (response) {
          if (response.data) {
            if (response.data.length > 0) {
              commit('setOldestMyBookId', response.data[response.data.length - 1].id)
              /* response.data.forEach(myBook => {
                console.log(myBook)
              }) */
              const booksArray = []
              // Get task key (id)
              response.data.forEach(myBook => {
                booksArray.push(
                  new Book(
                    myBook.title,
                    myBook.author,
                    myBook.genre,
                    myBook.description,
                    myBook.country,
                    myBook.city,
                    myBook.type,
                    myBook.image,
                    myBook.active,
                    myBook.userId,
                    myBook.userEmail,
                    myBook.updatedAt,
                    myBook.id
                  )
                )
              })
              const payload = {
                target: 'myBooks',
                books: booksArray
              }
              // Send mutation
              commit('loadBooks', payload)
            } else {
              commit('setOldestMyBookId', null)
            }
          }
        }).catch(function (e) {
          console.log(e)
        })
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async loadBooks ({commit, getters, dispatch}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const filterData = Object.assign({active: 1}, payload)
        // filterData.active = 1
        console.log('getters.oldestBookId', getters.oldestBookId)
        if (getters.oldestBookId) {
          filterData.lastId = getters.oldestBookId
        }
        const url = getters.baseRestApiUrl + '?controller=book&action=filter'
        const requestData = {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(filterData)
        }
        const request = new Request(url, requestData)
        await fetch(request).then(function (response) {
          return response.json()
        }).then(function (response) {
          if (response.data) {
            if (response.data.length > 0) {
              commit('setOldestBookId', response.data[response.data.length - 1].id)
              /* response.data.forEach(myBook => {
                console.log(myBook)
              }) */
              const booksArray = []
              // Get task key (id)
              response.data.forEach(book => {
                booksArray.push(
                  new Book(
                    book.title,
                    book.author,
                    book.genre,
                    book.description,
                    book.country,
                    book.city,
                    book.type,
                    book.image,
                    book.active,
                    book.userId,
                    book.userEmail,
                    book.updatedAt,
                    book.id
                  )
                )
              })
              const payload = {
                target: 'books',
                books: booksArray
              }
              // Send mutation
              commit('loadBooks', payload)
            } else {
              commit('setOldestBookId', null)
            }
          }
        }).catch(function (e) {
          console.log(e)
        })
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async editBook ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const oldId = payload.id
        let editedBookData = {
          'title': payload.title,
          'author': payload.author,
          'genre': '',
          'description': payload.description,
          'countryId': payload.country,
          'cityId': payload.city,
          'typeId': payload.type,
          'image': payload.image,
          'active': payload.active ? 1 : 0,
          'userId': getters.user.id,
          'userEmail': getters.user.email,
          'id': payload.id,
          'updatedAt': null
        }
        const url = getters.baseRestApiUrl + '?controller=book&action=edit'
        const requestData = {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(editedBookData)
        }
        const request = new Request(url, requestData)
        await fetch(request).then(function (response) {
          return response.json()
        }).then(function (response) {
          if (response.data) {
            response.data.oldId = oldId
            // Send mutation
            commit('editBook', {
              ...response.data
            })
          }
        }).catch(function (e) {
          console.log(e)
        })
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
    },
    clearMyBooks ({commit}) {
      commit('clearMyBooks')
      commit('setOldestMyBookId', null)
    },
    clearBooks ({commit, getters}) {
      commit('clearBooks')
      commit('setOldestBookId', null)
    },
    async requestBook ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const data = Object.assign({userEmail: getters.user.email}, payload)
        const url = getters.baseRestApiUrl + '?controller=request&action=create'
        const requestData = {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(data)
        }
        const request = new Request(url, requestData)
        await fetch(request).then(function (response) {
          return response.json()
        }).then(function (response) {
          // TODO уведомить пользователя, что его запрос отправлен
          console.log(response)
        }).catch(function (e) {
          console.log(e)
        })
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
    oldestMyBookId (state) {
      return state.oldestMyBookId
    },
    oldestBookId (state) {
      return state.oldestBookId
    }
  }
})
