const config = require('../config.js')
const mongoose = require('mongoose')
const glob = require('glob')
const {resolve} = require('path')

exports.initSchemas = () =>{
  glob.sync(resolve(__dirname,'./schema/','**/*.js')).forEach(require)
}

exports.connect = () => {
  let maxConnectTimes = 0
  mongoose.connect(config.DB_URL, {useNewUrlParser: true})

  return  new Promise((resolve, reject) => {
    mongoose.connection.on('disconnected', () => {
      console.log('数据库断开连接...')
      if (maxConnectTimes < 3) {
        maxConnectTimes++
        mongoose.connect(config.DB_URL, {useNewUrlParser: true})
      } else {
        reject(err)
        throw new Error('数据库错误')
      }
    })
    mongoose.connection.on('error', err => {
      console.log('数据库错误')
      if (maxConnectTimes < 3) {
        maxConnectTimes++
        mongoose.connect(config.DB_URL, {useNewUrlParser: true})
      } else {
        reject(err)
        throw new Error('数据库错误')
      }
    })
    mongoose.connection.once('open', () => {
      console.log('MongoDB connected successfully')
      resolve()
    })
  })
}