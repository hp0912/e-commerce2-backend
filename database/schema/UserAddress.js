const mongoose = require('mongoose')
const Schema = mongoose.Schema
let ObjectId = Schema.Types.ObjectId

const UserAddressSchema = new Schema({
  id: ObjectId,
  userid: String,
  name: String,
  tel: String,
  province: String,
  city: String,
  county: String,
  addressDetail: String,
  areaCode: String,
  postalCode: String,
  isDefault: Boolean,
  createAt: {type: Date, default:Date.now()}
}, {
  collections: 'UserAddress'
})

mongoose.model('UserAddress', UserAddressSchema)
