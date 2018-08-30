class authController {
  authUser (ctx, next) {
    if (!ctx.session.userId) {
      ctx.response.status = 401
      ctx.body = {status: 401, message: '未登录', data: {}}
    } else {
      return next()
    }
  }

  authAdmin (ctx, next) {
    if (!ctx.session.adminId) {
      ctx.response.status = 401
      ctx.body = {status: 401, message: '未登录', data: {}}
    } else {
      return next()
    }
  }
}

module.exports = new authController()
