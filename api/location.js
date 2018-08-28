const Router = require ('koa-router')
const locationController = require('./controller/locationController')

let router = new Router()

router.get("/getSuggestion", locationController.suggestion)
router.get("/getLocation", locationController.location)

module.exports = router