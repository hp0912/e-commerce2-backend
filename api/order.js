const Router = require ('koa-router')
const orderController = require('./controller/orderController')

let router = new Router()

router.post("/generateOrder", orderController.generateOrder)
router.get('/getOrderInfo/:orderId', orderController.getOrderInfo)

module.exports = router
