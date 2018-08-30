const Koa = require('koa')
const session = require('koa-session')
const mongoose = require('mongoose')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const Router = require('koa-router')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')
const {connect, initSchemas} = require('./database/init.js')

const app = new Koa()

app.keys = ['Houhou', 'aoaoaowu']
app.use(cors({
  origin: function (ctx) {
      return "http://127.0.0.1:8080"
  },
  //exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 3600,
  credentials: true,
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}))

;(async () =>{
  await connect()
  initSchemas()
})()

let SESSIONCONFIG = {
  key: 'SESSION_ID',
  maxAge: 2 * 60 * 60 * 1000, // cookie有效时长
  expires: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),  // cookie失效时间
  path: '/', // 写cookie所在的路径
  // domain: '', // 写cookie所在的域名
  httpOnly: true, // 是否只用于http请求中获取
  overwrite: true,  // 是否允许重写
  secure: false,
  // sameSite: '',
  signed: true,
  rolling: false,
  renew: true,
  store: {
    async destroy (id) {
      const sessionModel = mongoose.model('Sessions')
      return sessionModel.remove({ _id: id })
    },
    async get (id) {
      const sessionModel = mongoose.model('Sessions')
      const { data } = await sessionModel.findById(id)
      return data
    },
    async set (id, data, maxAge, { changed, rolling }) {
      if (changed || rolling) {
        const sessionModel = mongoose.model('Sessions')
        const record = { _id: id, data, updatedAt: new Date() }
        await sessionModel.findByIdAndUpdate(id, record, { upsert: true, safe: true })
      }
      return data
    }
  }
}

app.use(session(SESSIONCONFIG, app))

let user = require('./api/user.js')
let goods = require('./api/goods.js')
let location = require('./api/location.js')
let order = require('./api/order.js')
let pay = require('./api/pay.js')

let router = new Router();
router.use('/user', user.routes())
router.use('/goods', goods.routes())
router.use('/location', location.routes())
router.use('/order', order.routes())
router.use('/pay', pay.routes())

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(router.routes())
app.use(router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
