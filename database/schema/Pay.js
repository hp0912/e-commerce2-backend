const mongoose = require('mongoose')
const Schema = mongoose.Schema

const paySchema = new Schema({
    orderId: String,
    payUserId: {type: String, ref: 'user'},
    amount: Number, // 金额以分为单位
    status: String, // 支付状态: 未支付和已支付
    payType: String, // 支付渠道
    method: String, // 支付方式: 扫码或者调起APP
    code: Number, // 支付状态码
    createTime: {type:Date, default: new Date()}
}, {
    collection: 'Pay'
})

mongoose.model('Pay', paySchema)
