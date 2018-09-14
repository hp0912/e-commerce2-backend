const mongoose = require('mongoose')
const Schema = mongoose.Schema

const indexSchema = new Schema({
  data: {type: Object}
}, {
  collection: 'Index'
})

mongoose.model('Index', indexSchema)
