export default class BookModel {
  constructor (title, author, genre, description, country, city, type, image, active, updatedAt, id = null) {
    this.title = title
    this.author = author
    this.genre = genre
    this.description = description
    this.country = country
    this.city = city
    this.type = type
    this.image = image
    this.active = active
    this.updatedAt = updatedAt 
    this.id = id
  }
}
