const Koa = require('koa')
const app = new Koa()
const {connect, initSchemas} = require('./database/init.js')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const Router = require('koa-router')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')

app.use(cors({
  origin: function (ctx) {
      return "http://127.0.0.1:8080"
  },
  //exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 3600,
  credentials: true,
  allowMethods: ['GET', 'POST'],
  //allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

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

;(async () =>{
  await connect()
  initSchemas()
})()

module.exports = app
