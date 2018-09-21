const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SessionsSchema = new Schema({
  _id: String,
  data: Object,
  updatedAt: {
    default: new Date(),
    expires: 7200,
    type: Date
  }
}, {
  collection: 'Sessions'
})

mongoose.model('Sessions', SessionsSchema)
