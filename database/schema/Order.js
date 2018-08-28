const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema = new Schema({
    orderId: String,
    userId: {type: String, ref: 'user'},
    totalPrice: Number,
    goods: [
      {
        goodsId: String,
        name: String,
        count: Number,
        price: Number,
        image: String
      }
    ],
    shippingFee: Number,
    addressId: {type: Schema.ObjectId, ref: 'UserAddress'},
    remark: String,
    status: String,
    code: Number, // 支付状态码
    createTime: {type: Date, default: new Date()},
    createTimeTimestamp: {type: String},
    payRemainTime: String,
    hasComment: {type: Boolean, default: false}
})

mongoose.model('Order',orderSchema)