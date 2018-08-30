const Router = require ('koa-router')
const orderController = require('./controller/orderController')
const authController = require('./controller/authController')

let router = new Router()

router.post("/generateOrder", authController.authUser, orderController.generateOrder)
router.get('/getOrderInfo/:orderId', authController.authUser, orderController.getOrderInfo)

module.exports = router
