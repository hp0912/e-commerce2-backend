const mongoose = require('mongoose')
const Schema = mongoose.Schema

const goodsCommentSchema = new Schema({
  goodsId: String,
  orderId: String,
  userId: {type: String, ref: 'user'},
  userAvatar: String,
  nickname: String,
  rate: Number,
  comment: String,
  createTime: {type: Date, default: new Date()}
}, {
  collection: 'GoodsComment'
})

mongoose.model('GoodsComment', goodsCommentSchema)
