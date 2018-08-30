const Router = require ('koa-router')
const payController = require('./controller/payController')
const authController = require('./controller/authController')

let router = new Router()

router.post("/pay", authController.authUser, payController.pay)
router.post('/notify_url', payController.payNotice)

module.exports = router
