const Router = require ('koa-router')
const payController = require('./controller/payController')

let router = new Router()

router.post("/pay", payController.pay)
router.post('/notify_url', payController.payNotice)

module.exports = router
