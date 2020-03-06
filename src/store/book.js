import firebase from 'firebase/app'

import Book from './BookModel'

export default ({
  state: {
    // Локальный массив Books
    books: [],
    myBooks: [],
    oldestMyBookId: null,
    oldestBookKeyRef: null,
    currentBooksOwner: null,
    ownersBooksRemain: false
  },
  mutations: {
    newBook (
      state,
      {
        id,
        updatedAt,
        userId,
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
    setOldestMyBookId (state, payload) {
      state.oldestMyBookId = payload
    },
    setOldestBookKeyRef (state, payload) {
      state.oldestBookKeyRef = payload
    },
    setCurrentBooksOwner (state, payload) {
      state.currentBooksOwner = payload
    },
    setOwnersBooksRemain (state, payload) {
      state.ownersBooksRemain = payload
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
              response.data.forEach(myBook => {
                console.log(myBook)
              })
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
                    getters.user.id,
                    '-',
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
        // Пытаемся получить из удаленного хранилища четыре собственные книги пользователя,
        // отсортировав по ключам
        /* const booksResponse =
          await firebase.database()
            .ref(getters.user.id + '/books')
            .orderByKey()
            .limitToLast(4)
            .once('value') */
        // Get value
        /* const books = booksResponse.val()
        // console.log(books)
        if (books) {
          let arrayOfKeys =
            Object.keys(books)
              .sort()
              .reverse()
          commit('setOldestMyBookId', arrayOfKeys[arrayOfKeys.length - 1])
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
        } */
        // }
        /* else {
          const booksCountResponse =
            await firebase.database()
              .ref(getters.user.id + '/booksCount')
              .once('value')
          let booksCount = booksCountResponse.val()
          if (booksCount) {
            let arrayOfCountKeys =
              Object.keys(booksCount)
            booksCount = booksCount[arrayOfCountKeys[0]]
            // console.log(booksCount.count, getters.myBooks.length)
            if (booksCount.count > getters.myBooks.length) {
              const booksResponse =
                await firebase.database()
                  .ref(getters.user.id + '/books')
                  .orderByKey()
                  .endAt(getters.oldestMyBookId)
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
                commit('setOldestMyBookId', arrayOfKeys[arrayOfKeys.length - 1])
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
        } */
        // ***
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async loadBooks ({commit, getters, dispatch}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        console.log('test')
        console.log('oldestBookKeyRef', getters.oldestBookKeyRef)
        console.log('currentBooksOwner', getters.currentBooksOwner)
        console.log('ownersBooksRemain', getters.ownersBooksRemain)
        console.log('end test')
        // Если не осталось ИД пользователей в списке
        // (все книги выведены)
        if (getters.currentBooksOwner === -1) {
          // Завершаем работу данного действия - книг для загрузки в удаленном хранилище не осталось
          commit('setCurrentBooksOwner', null)
          commit('setLoading', false)
          return
        }
        /* Установка текущего владельца для вывода / продолжения вывода его книг */
        // Если у текущего владельца остаются книги -
        // не меняем текущего владельца
        if (getters.ownersBooksRemain) {
          console.log('ownersBooksRemain', getters.ownersBooksRemain)
        } else {
          // Иначе если текущий владелец книг установлен
          if (getters.currentBooksOwner) {
            // Пытаемся установить следующего владельца,
            // запрашивая из удаленного хранилища ИД текущего владельца книг и следующего за ним
            // console.log('currentBooksOwner', getters.currentBooksOwner)
            const userIdsResponse =
              await firebase.database()
                .ref('usersIds')
                // .orderByKey()
                .orderByChild('lastAddDate')
                .endAt(getters.currentBooksOwner.lastAddDate)
                .limitToLast(2)
                .once('value')
            // Извлекаем ответ из объекта-оболочки результата запроса
            const userIds = userIdsResponse.val()
            console.log('userIds', userIds)
            // Если объект ИД двоих владельцев получен
            if (userIds) {
              // Оставляем только ключ нового владельца из двух полученных
              var sortable = []
              for (var uid in userIds) {
                sortable.push([uid, userIds[uid]])
              }
              console.log('sortable', sortable)
              sortable
                .sort((uid1, uid2) => uid1[1].lastAddDate.localeCompare(uid2[1].lastAddDate))
                .slice(1)
              var userIdsSorted = {}
              sortable.forEach(function (item) {
                userIdsSorted[item[0]] = item[1]
              })
              let arrayOfKeys =
                Object.keys(userIdsSorted)
              // Когда не останется ни одного ИД в списке ИД пользователей -
              // сохраняем в локальное хранилище значение -1
              console.log('arrayOfKeys', arrayOfKeys)
              if (arrayOfKeys && arrayOfKeys.length === 1) {
                commit('setCurrentBooksOwner', -1)
              } else {
                commit('setCurrentBooksOwner', userIds[arrayOfKeys[0]] ? {key: arrayOfKeys[0], id: userIds[arrayOfKeys[0]].id, lastAddDate: userIds[arrayOfKeys[0]].lastAddDate} : -1)
              }
              if (userIds[arrayOfKeys[0]]) {
                commit('setOwnersBooksRemain', true)
                commit('setOldestBookKeyRef', null)
                console.log('rebuilt', getters.ownersBooksRemain)
              }
            } else {
              commit('setCurrentBooksOwner', -1)
            }
          } else {
            // Иначе сортируем в удаленном хранилище Id всех пользователей и находим Id самого первого
            const userIdsResponse =
              await firebase.database()
                .ref('usersIds')
                // .orderByKey()
                .orderByChild('lastAddDate')
                .limitToLast(1)
                .once('value')
            // Извлекаем значение из оболочки ответа удаленного хранилища
            const userIds = userIdsResponse.val()
            if (userIds) {
              let arrayOfKeys = Object.keys(userIds)
              commit('setCurrentBooksOwner', userIds[arrayOfKeys[0]] ? {key: arrayOfKeys[0], id: userIds[arrayOfKeys[0]].id, lastAddDate: userIds[arrayOfKeys[0]].lastAddDate} : -1)
            }
          }
        }
        /* Вывод книг текущего владельца */
        // Если выбран текущий владелец и нет ссылки на последнюю загруженную книгу
        if (getters.currentBooksOwner && !getters.oldestBookKeyRef) {
          // Пытаемся получить из удаленного хранилища четыре книги текущего пользователя,
          // отсортировав по ключам
          const booksResponse =
            await firebase.database()
              .ref(getters.currentBooksOwner.id + '/books')
              .orderByKey()
              .limitToLast(4)
              .once('value')
          // Get value
          const books = booksResponse.val()
          console.log('books1', books)
          if (books) {
            let arrayOfKeys =
              Object.keys(books)
                .sort()
                .reverse()
            commit('setOldestBookKeyRef', arrayOfKeys[arrayOfKeys.length - 1])
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
              target: 'books',
              books: booksArray
            }
            // Send mutation
            commit('loadBooks', payload)
            if (booksArray.length > 0) {
              commit('setOwnersBooksRemain', true)
            }
          }
        } else if (getters.currentBooksOwner) {
          // Пытаемся получить следующие 4 + 1 последнюю из предыдущего множества
          const booksResponse =
            await firebase.database()
              .ref(getters.currentBooksOwner.id + '/books')
              .orderByKey()
              .endAt(getters.oldestBookKeyRef)
              .limitToLast(5)
              .once('value')
          // Get value
          const books = booksResponse.val()
          console.log('books', books)
          if (books) {
            // Сортируем полученное множество книг по ключам и удаляем из него
            // одну последнюю из предыдущего множества, которая была нужна только для
            // определения начала очередного множества
            let arrayOfKeys =
              Object.keys(books)
                .sort()
                .reverse()
                .slice(1)
            if (arrayOfKeys.length > 0) {
              // Последнюю книгу из текущего множества сохраняем в локальном хранилище
              // для опредеоения начала следующего множества
              commit('setOldestBookKeyRef', arrayOfKeys[arrayOfKeys.length - 1])
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
                target: 'books',
                books: booksArray
              }
              // Send mutation
              commit('setOwnersBooksRemain', true)
              commit('loadBooks', payload)
            } else {
              console.log('disaster!')
              commit('setOwnersBooksRemain', false)
              // dispatch('loadBooks')
            }
          }
          // commit('setOwnersBooksRemain', true)
          /* } else {
            commit('setOwnersBooksRemain', false)
            dispatch('loadBooks')
          } */
        }
        // }
        // ***
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
    },
    async clearBooks ({commit, getters}) {
      commit('setOldestBookKeyRef', null)
      commit('setCurrentBooksOwner', null)
      commit('setOwnersBooksRemain', false)
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
    oldestBookKeyRef (state) {
      return state.oldestBookKeyRef
    },
    currentBooksOwner (state) {
      return state.currentBooksOwner
    },
    ownersBooksRemain (state) {
      return state.ownersBooksRemain
    }
  }
})
