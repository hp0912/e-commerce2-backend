const Router = require ('koa-router')
const mongoose = require('mongoose')
const CaptchaSDK = require('dx-captcha-sdk')
const QcloudSms = require("qcloudsms_js")
const config = require('../config')
const authController = require('./controller/authController')
const qcloudAuthorization = require('../base/qcloudAuthorization.js')

let router = new Router()
const sdk = new CaptchaSDK(config.dxAppID, config.dxAppSecret)

router.post('/sentVerificationCode',async(ctx)=>{
  let appid = config.smsappid
  let appkey = config.smsappkey
  let phoneNumbers = [ctx.request.body.tel]
  let templateId = 191869
  let smsSign = "嗷呜的个人主页"
  let sms = QcloudSms(appid, appkey)
  let verificationCode = (Math.random() + '').substr(2, 6)
  let ssender = sms.SmsSingleSender()
  let params = [verificationCode]

  if (!ctx.request.body.tel.match(/^[1][34578]\d{9}$/)) {
    ctx.body = {code:500, message: '请输入正确的手机号'}
    return
  }

  ssender.sendWithParam(86, phoneNumbers[0], templateId, params, smsSign, "", "", function(err, res, resData){
    if (err) {
      console.log("err: ", err.message, ctx.request.body.tel)
    } else {
      console.log("发送验证码成功", ctx.request.body.tel)
    }
  })
  ctx.session.verificationCode = verificationCode + '-' + ctx.request.body.tel
  console.log('验证码:', verificationCode)

  ctx.body={
    code:200,
    message:'发送成功'
  }
})

router.post('/register', async (ctx) => {
  const User = mongoose.model('User')
  let {userName, password, sms, reset} = ctx.request.body

  if (!userName.match(/^[1][34578]\d{9}$/)) {
    ctx.body = {code:500, message: '请输入正确的手机号'}
    return
  }

  try {
    if ((sms + '-' + userName) === ctx.session.verificationCode) {
      let _user = await User.findOne({userName: userName})
      if (_user) {
        if (reset) {
          await _user.update({password})
          ctx.session.userId = userName
          ctx.body = {code: 200, message: '重置成功'}
        } else {
          ctx.body = {code: 500, message: '手机号已被注册'}
        }
      } else {
        let newUser = new User({userName, password, nickname: 'houhou-' + userName})
        await newUser.save()
        ctx.session.userId = userName
        ctx.body = {code: 200, message: '注册成功'}
      }
    } else {
      ctx.body = {code: 500, message: '验证码错误'}
    }
  } catch (error) {
    console.log(error)
    ctx.body = {code: 500, message: error}
  }
})

router.post('/login', async(ctx) => {
  let loginUser = ctx.request.body
  let userName = loginUser.userName
  let password = loginUser.password
  let token = loginUser.token
  const User = mongoose.model('User')

  if (!userName.match(/^[1][34578]\d{9}$/)) {
    ctx.body = {code:500, message: '请输入正确的手机号'}
    return
  }

  try {
    let dxResult = await sdk.verifyToken(token)
    if (dxResult.result) {
      console.log('登录验证成功:', userName)
      let _user = await User.findOne({userName:userName})

      if (_user) {
        let newUser = new User()
        let isMatch = newUser.comparePassword(password, _user.password)
        if (isMatch) {
          ctx.session.userId = userName
          ctx.body = { code:200, result: true, message: '登录成功'}
        } else {
          ctx.body = { code:200, result: false, message: '用户名或密码错误'}
        }
      } else {
        ctx.body = { code:200, result: false, message: '用户名或密码错误'}
      }
    } else {
      ctx.body = { code: 500, result: false, message: '登录验证失败'}
    }
  } catch (error) {
    ctx.body = { code:500, message: error.message  }
  }
})

router.post('/logout', async(ctx) => {
  try {
    ctx.session = {}
    ctx.body = { code:200, result: true, message: '注销成功'}
  } catch (error) {
    ctx.body = { code:500, message: error.message  }
  }
})

router.post('/addAddress', authController.authUser, async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let addressObject = ctx.request.body
  addressObject.userid = ctx.session.userId

  try {
    if (addressObject.id) {
      let result = await UserAddress.find({_id: addressObject.id}, {createAt: 0, __v: 0})
      if (result.length) {
        if (addressObject.isDefault) {
          await UserAddress.update({userid: addressObject.userid}, { isDefault: false}, {multi: true})
        }
        await UserAddress.update({_id: addressObject.id}, {
          name: addressObject.name,
          tel: addressObject.tel,
          province: addressObject.province,
          city: addressObject.city,
          county: addressObject.county,
          addressDetail: addressObject.addressDetail,
          areaCode: addressObject.areaCode,
          postalCode: addressObject.postalCode,
          isDefault: addressObject.isDefault
        })
        ctx.body = {code: 200, message: '地址更新成功'}
      } else {
        ctx.body = {code: 500, message: '地址ID不存在'}
      }
    } else {
      if (addressObject.isDefault) {
        await UserAddress.update({userid: addressObject.userid}, { isDefault: false}, {multi: true})
      }
      let address = new UserAddress(addressObject)
      await address.save()
      ctx.body = {code: 200, message: '地址添加成功'}
    }
  } catch (error) {
    ctx.body = {code: 500, message: error}
  }
})

router.post('/delAddress', authController.authUser, async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let id = ctx.request.body.id

  try {
    address = await UserAddress.findByIdAndRemove(id)
    ctx.body = {code: 200, message: '地址删除成功'}
  } catch (error) {
    ctx.body = {code: 500, message: error}
  }
})

router.post('/getUserAddress', authController.authUser, async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let id = ctx.request.body.id
  let userid = ctx.session.userId

  try {
    let address
    if (id) {
      address = await UserAddress.find({userid, _id: id}, {createAt: 0, __v: 0})
    } else {
      address = await UserAddress.find({userid}, {createAt: 0, __v: 0})
    }
    ctx.body = {
      code: 200,
      data: {address},
      message: '获取地址成功'
    }
  } catch (error) {
    ctx.body = {code: 500, message: error}
  }
})

router.post('/getUserInfo', async (ctx) => {
  const userModel = mongoose.model('User')
  let userid = ctx.session.userId

  try {
    if (!userid) {
      ctx.body = {status: 200, data: {}, message: '未登录'}
    } else {
      let userInfo = await userModel.findOne({userName: userid}, {UserId: 0, password: 0, createAt: 0, lastLoginAt: 0, __v: 0})
      ctx.body = {status: 200, data: userInfo, message: '获取用户信息成功'}
    }
  } catch (error) {
    ctx.body = {status: 500, message: error}
  }
})

router.post('/updateUser', authController.authUser, async (ctx) => {
  const userModel = mongoose.model('User')
  let userid = ctx.session.userId
  let userInfo = ctx.request.body

  try {
    await userModel.update({userName: userid}, {nickname: userInfo.nickname})
    ctx.body = {status: 200, message: '更新成功'}
  } catch (error) {
    ctx.body = {status: 500, message: error.message}
  }
})

router.post('/uploadToken', authController.authUser, async (ctx) => {
  try {
    let tempKeys = await qcloudAuthorization.getTempKeys()
    ctx.body = {status: 200, message: '获取签名成功', tempKeys: tempKeys.data}
  } catch (error) {
    ctx.body = {status: 500, message: error.message}
  }
})

module.exports = router
