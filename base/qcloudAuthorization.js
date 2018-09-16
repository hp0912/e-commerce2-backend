const crypto = require('crypto')
const request = require('request')
const config = require('../config')

class QcloudAuthorization {
  constructor() {
    this.Url = 'https://sts.api.qcloud.com/v2/index.php'
    this.Domain = 'sts.api.qcloud.com'
    this.Proxy = ''
    this.AppId = '1256901433'
    this.SecretId = config.qcloudSecretId
    this.SecretKey = config.qcloudSecretKey
    this.Bucket = config.qcloudBucket
    this.Region = 'ap-guangzhou'
    this.AllowPrefix = 'ECUserAvatar/'
  }

  getRandom (min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  json2str (obj) {
    let arr = []
    Object.keys(obj).sort().forEach(item => {
      let val = obj[item] || ''
      arr.push(item + '=' + val)
    })
    return arr.join('&')
  }

  getSignature (opt, key, method) {
    let formatString = decodeURIComponent(method + this.Domain + '/v2/index.php?' + this.json2str(opt))
    let hmac = crypto.createHmac('sha1', key)
    return hmac.update(new Buffer(formatString, 'utf8')).digest('base64')
  }

  resourceUrlEncode (str) {
    str = encodeURIComponent(str)
    str = str.replace(/%2F/g, '/')
    str = str.replace(/%2A/g, '*')
    str = str.replace(/%28/g, '(')
    str = str.replace(/%29/g, ')')
    return str
  }

  getTempKeys () {
    let ShortBucketName = this.Bucket.substr(0 , this.Bucket.lastIndexOf('-'))
    let policy = {
      'version': '2.0',
      'statement': [{
        'action': [
            // 这里可以从临时密钥的权限上控制前端允许的操作
            // 'name/cos:*' // 这样写可以包含下面所有权限
            // 简单文件操作
            'name/cos:PutObject',
            'name/cos:PostObject',
            'name/cos:AppendObject',
            'name/cos:GetObject',
            'name/cos:HeadObject',
            'name/cos:OptionsObject',
            'name/cos:PutObjectCopy',
            'name/cos:PostObjectRestore',
            // 分片上传操作
            'name/cos:InitiateMultipartUpload',
            'name/cos:ListMultipartUploads',
            'name/cos:ListParts',
            'name/cos:UploadPart',
            'name/cos:CompleteMultipartUpload',
            'name/cos:AbortMultipartUpload',
        ],
        'effect': 'allow',
        'principal': {'qcs': ['*']},
        'resource': [
          'qcs::cos:' + this.Region + ':uid/' + this.AppId + ':prefix//' + this.AppId + '/' + ShortBucketName + '/',
          'qcs::cos:' + this.Region + ':uid/' + this.AppId + ':prefix//' + this.AppId + '/' + ShortBucketName + '/' + this.resourceUrlEncode(this.AllowPrefix)
        ]
      }]
    }

    let policyStr = JSON.stringify(policy)
    let Action = 'GetFederationToken'
    let Nonce = this.getRandom(10000, 20000)
    let Timestamp = parseInt(+new Date() / 1000)
    let Method = 'GET'
    let params = {
      Action: Action,
      Nonce: Nonce,
      Region: '',
      SecretId: this.SecretId,
      Timestamp: Timestamp,
      durationSeconds: 7200,
      name: 'cos',
      policy: encodeURIComponent(policyStr)
    }

    params.Signature = encodeURIComponent(this.getSignature(params, this.SecretKey, Method))

    let opt = {
      method: Method,
      url: this.Url + '?' + this.json2str(params),
      rejectUnauthorized: false,
      headers: {
        Host: this.Domain
      },
      proxy: this.Proxy || ''
    }

    return new Promise((resolve, reject) => {
      request(opt, function (err, response, body) {
        if (err) {
          return reject(err)
        } else {
          return resolve(JSON.parse(body))
        }
      })
    })
  }
}

module.exports = new QcloudAuthorization()

