const Router = require ('koa-router')
const mongoose = require('mongoose')
const CaptchaSDK = require('dx-captcha-sdk')
const config = require('../config')

let router = new Router()
const sdk = new CaptchaSDK(config.dxAppID, config.dxAppSecret)

router.get('/',async(ctx)=>{
  ctx.body = "这是用户操作首页"
})

router.post('/sentVerificationCode',async(ctx)=>{
  // const User = mongoose.model('User')
  // let newUser = new User(ctx.request.body)
  
  ctx.body={
    code:200,
    message:'发送成功'
  }
})

router.post('/register', async (ctx) => {
  const User = mongoose.model('User')
  let newUser = new User(ctx.request.body)

  await newUser.save().then(() => {
    ctx.body = {
      code: 200,
      message: '注册成功'
    }
  }).catch(error => {
    ctx.body = {
      code: 500,
      message: error
    }
  })
})

router.post('/login', async(ctx) => {
  let loginUser = ctx.request.body
  let userName = loginUser.userName
  let password = loginUser.password
  let token = loginUser.token
  const User = mongoose.model('User')
  
  await User.findOne({userName:userName}).exec().then(async(result) => {
    if(result){
      await sdk.verifyToken(token).then(() => {
        let newUser = new User()  //因为是实例方法，所以要new出对象，才能调用
        return newUser.comparePassword(password, result.password)
        .then((isMatch) => {
          ctx.body={ code:200, result: isMatch, message: isMatch ? '登录成功' : '用户名或密码错误'} 
        })
        .catch(error => {
          ctx.body={ code:500, result: false, message: '内部服务器错误'}
        })
      }).catch(err => {
        ctx.body={ code: 500, result: false, message: '登录验证失败'}
      })
    }else{
        ctx.body={ code:200, result: false, message: '用户名或密码错误'}
    }
  }).catch(error => {
    ctx.body={ code:500, message:error  }
  })
})

router.post('/addAddress', async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let addressObject = ctx.request.body;
  addressObject.userid = '13767477350'

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

router.post('/delAddress', async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let id = ctx.request.body.id

  try {
    address = await UserAddress.findByIdAndRemove(id)
    ctx.body = {code: 200, message: '地址删除成功'}
  } catch (error) {
    ctx.body = {code: 500, message: error}
  }
})

router.post('/getUserAddress', async (ctx) => {
  const UserAddress = mongoose.model('UserAddress')
  let id = ctx.request.body.id
  let userid = '13767477350'

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

module.exports = router
