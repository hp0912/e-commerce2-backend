const BaseClass = require('../../base/base.js')

class locationController extends BaseClass {
    constructor() {
        super()
        this.suggestion = this.suggestion.bind(this)
        this.location = this.location.bind(this)
    }

    //输入地址关键词找位置
    async suggestion(ctx) {
        let {keyword} = ctx.request.query
        if (!keyword) {
            ctx.body={status: -1, message: '位置搜索失败，参数有误！'}
            return
        }
        try {
            let data = await this.locationSearch(keyword)
            ctx.body={status: 200, message: '获取位置信息成功', data: data}
        } catch (err) {
            console.log('获取位置信息失败', err)
            ctx.body={status: -1, message: '获取位置信息失败'}
        }
    }

    //定位当前位置
    async location(ctx) {
        try {
            console.log(ctx.request.ip)
            let result = await this.getLocation(ctx.request.ip)
            let data = await this.getDetailPosition(result)
            ctx.body={status: 200, message: '获取位置信息成功', data: data}
        } catch (err) {
            console.log('获取位置信息失败')
            ctx.body={status: -1, message: '获取位置信息失败'}
        }
    }
}

module.exports = new locationController()