const BaseClass = require('../../base/base.js')
const mongoose = require('mongoose')

class orderController extends BaseClass {
  constructor() {
    super()
    this.generateOrder = this.generateOrder.bind(this)
    this.getOrderInfo = this.getOrderInfo.bind(this)
  }

  async generateOrder(ctx) {
    let {addressId, goods} = ctx.request.body
    if (!addressId || !goods || !goods.length) {
      ctx.body = {status: -1, message: '下订单失败，参数有误'}
      return
    }
    try {
      let promiseArr = []
      const userAddressModel = mongoose.model('UserAddress')
      const userModel = mongoose.model('User')
      const orderModel = mongoose.model('Order')

      promiseArr.push(this.computeTotalPrice(goods))
      promiseArr.push(userAddressModel.findOne({_id: addressId}))
      promiseArr.push(userModel.findOne({userName: ctx.session.userId}))
      promiseArr.push(this.generateOrderID())

      let values = await Promise.all(promiseArr)
      let orderData = {
        orderId: values[3],
        userId: values[2].userName,
        totalPrice: values[0].totalPrice,
        goods: values[0].orderGoods,
        shippingFee: 0,
        addressId: values[1]._id,
        remark: '',
        status: '未支付',
        code: 0,
        createTime: new Date(),
        createTimeTimestamp: Math.floor(new Date().getTime() / 1000)
      }
      let order = new orderModel(orderData)
      await order.save()
      ctx.body = {status: 200, message: '提交订单成功，请尽快支付', orderId: values[3], totalPrice: '0.10'} // 免单优惠, 最低支付0.1元
    } catch (err) {
      console.log(err.message)
      ctx.body = {status: -1, message: '内部服务器错误'}
    }
  }

  async getOrderInfo (ctx) {
    const orderId = ctx.params.orderId
    if (!orderId) {
      ctx.body = {status: -1, message: '获取指定订单失败，参数有误'}
      return
    }
    try {
      const orderModel = mongoose.model('Order')
      let order = await orderModel.findOne({orderId: orderId}).populate([{path: 'addressId'}])

      if (!order) {
        ctx.body = {status: -1, message: '该订单不存在'}
        return
      }
      await this.computeRemainTime(order)
      ctx.body = {status: 200, message: '获取指定订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取指定订单失败'}
    }
  }

  async pendingPayment (ctx) {
    try {
      let userId = ctx.session.userId
      let queryTime = new Date(new Date().getTime() - 15 * 60 * 1000)
      let page = ctx.request.body.page || 1
      let num = 10 //每页显示数量
      let start = (page - 1) * num
      const orderModel = mongoose.model('Order')

      let order = await orderModel.find({userId, code: 0, createTime: {"$gt": queryTime}}).skip(start).limit(num)

      ctx.body = {status: 200, message: '获取订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单失败'}
    }
  }

  async cancelOrder (ctx) {
    try {
      let userId = ctx.session.userId
      let orderId = ctx.request.body.orderId
      const orderModel = mongoose.model('Order')

      let order = await orderModel.findOne({userId, orderId, code: 0})
      if (order) {
        await order.update({createTime: new Date(0), createTimeTimestamp: 0})
      }

      ctx.body = {status: 200, message: '订单取消成功'}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '订单取消失败'}
    }
  }

  async pendingDeliver (ctx) {
    try {
      let userId = ctx.session.userId
      let page = ctx.request.body.page || 1
      let num = 10 //每页显示数量
      let start = (page - 1) * num
      const orderModel = mongoose.model('Order')

      let order = await orderModel.find({userId, code: 200, confirmReceipt: false}).skip(start).limit(num)

      ctx.body = {status: 200, message: '获取订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单失败'}
    }
  }

  async confirmReceipt (ctx) {
    try {
      let userId = ctx.session.userId
      let orderId = ctx.request.body.orderId
      const orderModel = mongoose.model('Order')

      let order = await orderModel.findOne({userId, orderId, confirmReceipt: false})
      if (order) {
        await order.update({confirmReceipt: true})
      }

      ctx.body = {status: 200, message: '已确认收货'}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '内部服务器错误'}
    }
  }

  async pendingEvaluate (ctx) {
    try {
      let userId = ctx.session.userId
      let page = ctx.request.body.page || 1
      let num = 10 //每页显示数量
      let start = (page - 1) * num
      const orderModel = mongoose.model('Order')

      let order = await orderModel.find({userId, code: 200, confirmReceipt: true, hasComment: false}).skip(start).limit(num)

      ctx.body = {status: 200, message: '获取订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单失败'}
    }
  }

  async submitComment (ctx) {
    try {
      let userId = ctx.session.userId
      let commentData = ctx.request.body.commentData
      let orderId = commentData.orderId
      const orderModel = mongoose.model('Order')
      const userModel = mongoose.model('User')
      const goodsCommentModel = mongoose.model('GoodsComment')

      let order = await orderModel.findOne({orderId, userId, code: 200, confirmReceipt: true, hasComment: false})
      let user = await userModel.findOne({userName: userId})

      if (order) {
        let comments = []
        order.goods.forEach((goods, index) => {
          let comment = {
            goodsId: goods.goodsId,
            orderId: order.orderId,
            userId,
            userAvatar: user.avatar,
            nickname: user.nickname,
            rate: commentData.comment[goods.goodsId].rate || 0,
            comment: commentData.comment[goods.goodsId].comment || ''
          }
          comments.push(comment)
        })
        
        let promiseArr = []
        promiseArr.push(goodsCommentModel.insertMany(comments))
        promiseArr.push(order.update({hasComment: true}))
        
        await Promise.all(promiseArr)
        ctx.body = {status: 200, message: '提交评论成功'}
      } else {
        ctx.body = {status: 500, message: '订单参数错误'}
      }
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '提交评论失败'}
    }
  }

  async getQtyOfOrder (ctx) {
    try {
      let userId = ctx.session.userId
      let queryTime = new Date(new Date().getTime() - 15 * 60 * 1000)
      const orderModel = mongoose.model('Order')

      let count1 = orderModel.count({userId, code: 0, createTime: {"$gt": queryTime}}) // 待支付订单数量
      let count2 = 0 // 待发货订单数量, 平台自动发货
      let count3 = orderModel.count({userId, code: 200, confirmReceipt: false}) // 待收货订单数量
      let count4 = orderModel.count({userId, code: 200, confirmReceipt: true, hasComment: false}) // 待评价订单数量

      let result = await Promise.all([count1, count2, count3, count4])
      let orderQty = {
        count1: result[0],
        count2: result[1],
        count3: result[2],
        count4: result[3]
      }
      ctx.body = {status: 200, message: '获取订单数量成功', data: orderQty}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单数量失败'}
    }
  }

  async expiredOrder (ctx) {
    try {
      let userId = ctx.session.userId
      let queryTime = new Date(new Date().getTime() - 15 * 60 * 1000)
      let page = ctx.request.body.page || 1
      let num = 10 //每页显示数量
      let start = (page - 1) * num
      const orderModel = mongoose.model('Order')

      let order = await orderModel.find({userId, code: 0, createTime: {"$lt": queryTime}}).skip(start).limit(num)

      ctx.body = {status: 200, message: '获取订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单失败'}
    }
  }

  async completedOrder (ctx) {
    try {
      let userId = ctx.session.userId
      let page = ctx.request.body.page || 1
      let num = 10 //每页显示数量
      let start = (page - 1) * num
      const orderModel = mongoose.model('Order')

      let order = await orderModel.find({userId, code: 200, confirmReceipt: true, hasComment: true}).skip(start).limit(num)

      ctx.body = {status: 200, message: '获取订单成功', data: order}
    } catch (error) {
      console.log(error.message)
      ctx.body = {status: -1, message: '获取订单失败'}
    }
  }

  async computeTotalPrice (goods) {
    let totalPrice = 0, orderGoods = []

    for (let i = 0; i < goods.length; i++) {
      const goodsModel = mongoose.model('Goods')
      let _goods = await goodsModel.findOne({ID: goods[i]['goodsId']})
      orderGoods.push({
        goodsId: _goods['ID'],
        name: _goods['NAME'],
        count: goods[i]['count'],
        price: _goods['ORI_PRICE'],
        image: _goods['IMAGE1']
      })
      totalPrice += Number(_goods['ORI_PRICE']) * Number(goods[i]['count'])
    }
    return {totalPrice, orderGoods}
  }

  async computeRemainTime (order) {
    if (order.code !== 200) {
      let fifteenMinutes = 60 * 15
      let now = Math.floor(new Date().getTime() / 1000)
      let orderTime = order.createTimeTimestamp
      if (now - orderTime >= fifteenMinutes) {
          order.status = '超过支付期限'
          order.code = 400
          order.payRemainTime = 0
      } else {
          order.payRemainTime = fifteenMinutes - (now - orderTime)
      }
      await order.save()
      return order
    }
  }

  async generateOrderID () {
    let Now = new Date()
    return 'Houhou-' + Now.getFullYear() 
      + (Now.getMonth() + 1 + '').padStart(2, '0') 
      + (Now.getDate() + '').padStart(2, '0')
      + (Now.getHours() + '').padStart(2, '0') 
      + (Now.getMinutes() + '').padStart(2, '0') 
      + (Now.getSeconds() + '').padStart(2, '0') 
      + (Math.random() + '').substr(2, 6)
  }
}

module.exports = new orderController()