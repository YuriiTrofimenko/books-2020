import firebase from 'firebase/app'

import Book from './BookModel'

export default ({
  state: {
    // Локальный массив Books
    books: [],
    myBooks: [],
    oldestMyBookKeyRef: null,
    oldestBookKeyRef: null,
    currentBooksOwner: null,
    ownersBooksRemain: false
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
          // Добавляем в корень удаленного хранилища, в дочерний узел usersIds
          // Id данного пользователя
          firebase.database()
            .ref('usersIds')
            .push({'id': getters.user.id})
          // Добавляем в узел пользователя в удаленном хранилище, в дочерний узел booksCount
          // объект счетчика собственных книг с начальным значением 1
          firebase.database()
            .ref(getters.user.id + '/booksCount')
            .push({'count': 1})
        } else {
          let arrayOfKeys =
            Object.keys(booksCount)
          booksCount = booksCount[arrayOfKeys[0]]
          // console.log(booksCount)
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
    // Загрузка собственных книг пользователя
    async loadMyBooks ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        // Если нет ссылки на последнюю загруженную собственную книгу
        if (!getters.oldestMyBookKeyRef) {
          // Пытаемся получить из удаленного хранилища четыре собственные книги пользователя,
          // отсортировав по ключам
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
            // console.log(booksCount.count, getters.myBooks.length)
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
        if (getters.currentBooksOwner === -1) {
          console.log('-------------------1')
          // Завершаем работу данного действия - книг для загрузки в удаленном хранилище не осталось
          commit('setCurrentBooksOwner', null)
          commit('setLoading', false)
          return
        }
        // Если у текущего владельца остаются книги -
        // не меняем владельца
        if (getters.ownersBooksRemain) {
          console.log('ownersBooksRemain', getters.ownersBooksRemain)
        } else {
          // Иначе если текущий владелец книг установлен
          if (getters.currentBooksOwner) {
            // Пытаемся установить следующего владельца,
            // запрашивая из удаленного хранилища ИД текущего владельца книг и следующего за ним
            console.log('currentBooksOwner', getters.currentBooksOwner)
            const userIdsResponse =
              await firebase.database()
                .ref('usersIds')
                .orderByKey()
                .endAt(getters.currentBooksOwner.key)
                .limitToLast(2)
                .once('value')
            // Извлекаем ответ из объекта-оболочки результата запроса
            const userIds = userIdsResponse.val()
            console.log('userIds', userIds)
            // Если объект получен
            if (userIds) {
              // Оставляем только ключ нового владельца из двух полученных
              let arrayOfKeys =
                Object.keys(userIds)
                  .sort()
                  .reverse()
                  .slice(1)
              // Когда не останется ни одного ИД в списке ИД пользователей -
              // сохраняем в локальное хранилище значение -1
              console.log('arrayOfKeys', arrayOfKeys)
              commit('setCurrentBooksOwner', userIds[arrayOfKeys[0]] ? {key: arrayOfKeys[0], id: userIds[arrayOfKeys[0]].id} : -1)
              if (userIds[arrayOfKeys[0]]) {
                commit('setOwnersBooksRemain', true)
                commit('setOldestBookKeyRef', null)
                console.log('rebuilt', getters.ownersBooksRemain)
              }
            }
          } else {
            // Иначе сортируем в удаленном хранилище Id всех пользователей и находим Id самого первого
            const userIdsResponse =
              await firebase.database()
                .ref('usersIds')
                .orderByKey()
                .limitToLast(1)
                .once('value')
            // Извлекаем значение из оболочки ответа удаленного хранилища
            const userIds = userIdsResponse.val()
            if (userIds) {
              let arrayOfKeys = Object.keys(userIds)
              commit('setCurrentBooksOwner', userIds[arrayOfKeys[0]] ? {key: arrayOfKeys[0], id: userIds[arrayOfKeys[0]].id} : -1)
            }
          }
        }
        // Если нет ссылки на последнюю загруженную книгу
        if (!getters.oldestBookKeyRef) {
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
        } else {
          /* // Попытка получить из удаленного хранилища объект
          // счетчика книг данного пользователя
          const booksCountResponse =
            await firebase.database()
              .ref(getters.currentBooksOwner + '/booksCount')
              .once('value')
          let booksCount = booksCountResponse.val()
          // Если получен объект со значением счетчика
          if (booksCount) {
            // Извлекаем значение счетчика из единственного объекта (под индексом 0)
            let arrayOfCountKeys =
              Object.keys(booksCount)
            booksCount = booksCount[arrayOfCountKeys[0]]
            // Если количество книг в локальном хранилище меньше, чем в удаленном
            console.log(booksCount.count, ' - ', getters.books.length)
            if (booksCount.count > getters.books.length) { */
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
    oldestMyBookKeyRef (state) {
      return state.oldestMyBookKeyRef
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
