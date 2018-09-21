const Router = require ('koa-router')
let router = new Router()
const mongoose = require('mongoose')

router.post('/getIndexGoodsInfo',async(ctx) => {
    try{
        const Index = mongoose.model('Index')
        let result = await Index.findOne({}, {_id: 0}).exec()
        ctx.body={code: 200, message: '成功', data: result.data}
    }catch (err) {
        ctx.body={code: 500, message: err}
    }
})

router.post('/getDetailGoodsInfo',async(ctx) => {
    try{
        let goodsId = ctx.request.body.goodsId
        const Goods = mongoose.model('Goods')
        let result = await Goods.findOne({ID: goodsId}).exec()
        ctx.body={code: 200, message: result}
    }catch (err) {
        ctx.body={code: 500, message: err}
    }
})

router.post('/getGoodsComments',async(ctx) => {
    try{
        let goodsId = ctx.request.body.goodsId
        let page = ctx.request.body.page || 1
        let num = 10 //每页显示数量
        let start = (page - 1) * num
        const goodsCommentModel = mongoose.model('GoodsComment')

        // 按评价日期降序排列 _id, userId, orderId, __v字段不显示
        let result = await goodsCommentModel.find({goodsId}, {_id: 0, userId: 0, orderId: 0, __v: 0}).sort({createTime: 'desc'}).skip(start).limit(num)

        ctx.body={code: 200, message: '获取商品评价成功', data: result}
    }catch (err) {
        ctx.body={code: 500, message: err}
    }
})

router.get('/getCategoryList',async(ctx) => {
    try{
        const Category = mongoose.model('Category')
        let result = await Category.find().exec()
        ctx.body={code:200,message:result}
    }catch(err){
        ctx.body={code:500,message:err}
    }
})

router.post('/getCategorySubList', async(ctx) => {
    try{
        let categoryId = ctx.request.body.categoryId
        const CategorySub = mongoose.model('CategorySub')
        let result = await CategorySub.find({MALL_CATEGORY_ID: categoryId}).exec()
        ctx.body={code: 200, message: result}
    }catch (err) {
        ctx.body={code: 500, message: err}
    }
})

router.post('/getGoodsListByCategorySubID', async(ctx) => {
    try {
        let categorySubId = ctx.request.body.categorySubId
        let page = ctx.request.body.page
        let num = 10 //每页显示数量
        let start = (page - 1) * num
        const Goods = mongoose.model('Goods')
        let result = await Goods.find({SUB_ID:categorySubId}).skip(start) .limit(num).exec()

        ctx.body = {code: 200, message: result}
    } catch(err) {
        ctx.body = {code: 500, message: err}
    }
})

router.post('/searchGoods', async(ctx) => {
    try {
        let keyword = decodeURIComponent(ctx.request.body.keyword)
        let page = ctx.request.body.page
        let num = 10 //每页显示数量
        let start = (page - 1) * num
        const Goods = mongoose.model('Goods')
        const reg = new RegExp(keyword, 'i')
        let result = await Goods.find({'NAME': reg}).skip(start).limit(num).exec()

        ctx.body = {code: 200, message: result}
    } catch(err) {
        ctx.body = {code: 500, message: err}
    }
})

module.exports = router
