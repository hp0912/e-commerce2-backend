const md5 = require('blueimp-md5')
const BaseClass = require('../../base/base.js')
const mongoose = require('mongoose')
const config = require('../../config')
const fetch = require('node-fetch')
const FormData = require('form-data')

class payController extends BaseClass {
  constructor() {
    super()
    this.appkey = config.trPayappkey
    this.appSceret = config.trPayappSceret
    this.pay = this.pay.bind(this)
    this.payNotice = this.payNotice.bind(this)
  }

  async pay (ctx) {
    let {orderId, payType = '1', method = 'trpay.trade.create.scan'} = ctx.request.body
    if (!orderId) {
      ctx.body = {status: -1, message: '初始化支付失败参数有误'}
      return
    }
    try {
      const payModel = mongoose.model('Pay')

      let pay = await payModel.findOne({orderId})
      if (pay && pay.code === 200) {
        ctx.body = {status: -1, message: '该订单已完成支付'}
        return
      }
      if (pay) { // 重新初始化订单
        pay.remove()
      }

      let payUserId = ctx.session.userId
      let payData = {
        amount: '1', // 免单,最低支付1分
        tradeName: '吼吼订单支付', // 商户自定义订单标题
        outTradeNo: orderId, // 商户自主生成的订单号
        payType: payType, // 支付渠道
        payuserid: payUserId, // 商家支付id
        notifyUrl: config.notifyUrl, // 服务器异步通知
        appkey: this.appkey,
        method,
        timestamp: new Date().getTime() + '',
        version: '1.0'
      }

      let sign = ''
      if (method === 'trpay.trade.create.scan') {
        sign = this.sign(payData)
        payData['sign'] = sign
        let result = await this.scanPay(ctx, payData)
        if (result.code !== '0000') {
          ctx.body = {status: -1, message: '支付接口出错，请更改支付方式'}
          return
        }
        await this.savePayData({method: 'scan', orderId, payUserId, payType})
        ctx.body = {status: 1, message: '获取二维码成功，请扫码支付', data: {...result, ...payData, orderId}}
      } else {
        payData.synNotifyUrl = `${config.synNotifyUrl}/#/orderDetail?id=${orderId}` // 客户端同步跳转
        sign = this.sign(payData)
        payData['sign'] = sign
        await this.savePayData({method: 'wap', orderId, payUserId, payType, code: 0})
        ctx.body = {status: 200, message: '支付初始化成功', data: payData}
      }
    } catch (err) {
      console.log(err.message)
      ctx.body = {status: -1, message: '初始化支付失败'}
    }
  }

  async payNotice (ctx) {
    let noticeData = ctx.request.body
    try {
      let sign = noticeData.sign
      delete noticeData.sign
      let verifySign = this.sign(noticeData)
      const payModel = mongoose.model('Pay')
      const orderModel = mongoose.model('Order')

      if (verifySign === sign && noticeData.status === '2') {
        let pay = await payModel.findOne({orderId: noticeData.outTradeNo})
        pay.status = '支付成功'
        pay.code = 200
        let order = await orderModel.findOne({orderId: pay.orderId})
        order.status = '支付成功'
        order.code = 200
        await pay.save()
        await order.save()
        ctx.body = 200
      }
    } catch (err) {
      console.log('支付失败', err.message)
      ctx.body = 500
    }
  }

  async scanPay(ctx, payData) {
    let formData = new FormData()
    for (let key in payData) {
      formData.append(key, payData[key])
    }
    let result = await fetch('https://pay.trsoft.xin/order/trpayGetWay', {
      method: 'POST',
      body: formData
    })
    return result = await result.json()
  }

  // 生成签名
  sign (payData) {
    let keys = Object.keys(payData)
    keys = keys.sort()
    let string = ''
    for (let i = 0; i < keys.length; i++) {
      string = string + keys[i] + '=' + payData[keys[i]] + '&'
    }
    string = string + "appSceret=" + this.appSceret
    return md5(string).toUpperCase()
  }

  async savePayData (obj) {
    const payModel = mongoose.model('Pay')
    let payType = obj.payType === '1' ? '支付宝' : '微信'
    let saveDB = {
      amount: 1,
      payType,
      status: '未支付',
      ...obj
    }
    let initPay = new payModel(saveDB)
    await initPay.save()
  }

  async queryPayStatus (ctx) {
    let orderId = ctx.request.body.outTradeNo
    try {
      let payModel = mongoose.model('Pay')
      let pay = await payModel.findOne({orderId})
      if (pay.code === 200) {
        ctx.body = {status: 200, message: '支付完成'}
      } else {
        ctx.body = {status: -1, message: '未支付'}
      }
    } catch (err) {
      console.log('监听扫码状态失败', err.message)
      ctx.body = {status: -1, message: '支付接口异常'}
    }
  }
}

module.exports = new payController()