const Router = require ('koa-router')
const orderController = require('./controller/orderController')
const authController = require('./controller/authController')

let router = new Router()

router.post("/generateOrder", authController.authUser, orderController.generateOrder)
router.get('/getOrderInfo/:orderId', authController.authUser, orderController.getOrderInfo)
router.post("/pendingPayment", authController.authUser, orderController.pendingPayment)
router.post("/cancelOrder", authController.authUser, orderController.cancelOrder)
router.post("/pendingDeliver", authController.authUser, orderController.pendingDeliver)
router.post("/confirmReceipt", authController.authUser, orderController.confirmReceipt) // 确认收货
router.post("/pendingEvaluate", authController.authUser, orderController.pendingEvaluate) // 待评价
router.post("/submitComment", authController.authUser, orderController.submitComment) // 提交评价
router.post("/getQtyOfOrder", authController.authUser, orderController.getQtyOfOrder) // 获取订单数量
router.post("/expiredOrder", authController.authUser, orderController.expiredOrder) // 已过期的订单
router.post("/completedOrder", authController.authUser, orderController.completedOrder) // 已完成的订单

module.exports = router
