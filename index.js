/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-16 18:27:29
 *
 */

'use strict'
require('es.shim')
const Parser = require('./lib')
const FS = require('iofs')
const URL = require('url')
const QS = require('querystring')
const tmpdir = __dirname + '/.tmp/'

function hideProperty(host, name, value) {
  Object.defineProperty(host, name, {
    value: value,
    writable: true,
    enumerable: false,
    configurable: true
  })
}

class Request {
  constructor(req, res) {
    this.method = req.method.toUpperCase()
    this.router = {}

    hideProperty(this, 'origin', { req, res })
    hideProperty(this, '__GET__', null)
    hideProperty(this, '__POST__', null)

    this.__fixUrl()

    if (!FS.isdir(tmpdir)) {
      FS.mkdir(tmpdir)
    } else {
      // 清除2个小时前的所有临时文件
      let list = FS.ls(tmpdir)
      list.forEach(it => {
        if (FS.stat(tmpdir + it).atime < Date.now() - 2 * 3600 * 1000) {
          FS.rm(tmpdir + it)
        }
      })
    }
  }

  // 修正请求的url
  __fixUrl() {
    let _url = URL.parse(this.origin.req.url)
      .pathname.slice(1)
      .replace(/[\/]+$/, '')
    let app = '' // 将作为主控制器(即apps目录下的应用)
    let pathArr = []
    let tmpArr = []

    // URL上不允许有非法字符
    if (/[^\w\-\/\.]/.test(_url)) {
      this.origin.res.rendered = true
      this.origin.res.writeHead(400, {
        'X-debug': 'url[' + _url + '] contains illegal characters'
      })
      return this.origin.res.end('')
    }

    // 修正url中可能出现的"多斜杠"
    _url = _url.replace(/[\/]+/g, '/').replace(/^\//, '')

    pathArr = _url.split('/')
    if (!pathArr[0] || pathArr[0] === '') {
      pathArr[0] = 'index'
    }

    if (pathArr[0].indexOf('.') !== -1) {
      app = pathArr[0].slice(0, pathArr[0].indexOf('.'))
      // 如果app为空(这种情况一般是url前面带了个"."造成的),则自动默认为index
      if (!app || app === '') {
        app = 'index'
      }
    } else {
      app = pathArr[0]
    }

    pathArr.shift()

    // 将path第3段之后的部分, 每2个一组转为key-val数据对象, 存入router中
    tmpArr = pathArr.slice(1).concat()
    while (tmpArr.length) {
      this.router[tmpArr.shift()] = tmpArr.shift() || null
    }
    tmpArr = undefined

    for (let i in this.router) {
      if (!this.router[i]) {
        continue
      }
      // 修正数字类型,把符合条件的数字字符串转为数字(也许会误转, 但总的来说是利大弊)
      if (this.router[i].startsWith(0) && !this.router[i].startsWith('0.')) {
        continue
      } else if (isFinite(this.router[i])) {
        this.router[i] = +this.router[i]
      }
    }

    this.app = app
    this.url = _url
    this.path = pathArr
  }

  /**
   * [get 同php的$_GET]
   */
  get(key = '', xss = true) {
    xss = !!xss
    if (!this.__GET__) {
      let para = URL.parse(this.origin.req.url).query
      para = Object.assign({}, QS.parse(para))
      if (xss) {
        for (let i in para) {
          if (!para[i]) {
            continue
          }

          if (Array.isArray(para[i])) {
            para[i] = para[i].map(it => {
              it = it.trim().xss()
              if (it.startsWith(0) && !it.startsWith('0.')) {
                return it
              } else if (isFinite(it)) {
                it = +it
              }
              return it
            })
          } else {
            para[i] = para[i].trim().xss()

            if (para[i].startsWith(0) && !para[i].startsWith('0.')) {
              continue
            } else if (isFinite(para[i])) {
              para[i] = +para[i]
            }
          }
        }
      }
      this.__GET__ = para
    }

    return key
      ? this.__GET__.hasOwnProperty(key) ? this.__GET__[key] : null
      : this.__GET__
  }

  /**
   * [post 接收post, 需要 await ]
   * @param  {Str}    key      [字段]
   */
  post(key = '', xss = true) {
    let para = {}
    let out = Promise.defer()
    xss = !!xss

    //如果之前已经缓存过,则直接从缓存读取
    if (this.__POST__) {
      if (key) {
        return this.__POST__.hasOwnProperty(key) ? this.__POST__[key] : null
      } else {
        return this.__POST__
      }
    }

    let form = new Parser()
    form.uploadDir = tmpdir
    form.parse(this.origin.req)

    form.on('field', (name, value) => {
      if (/urlencoded/i.test(this.header('content-type'))) {
        if (
          name.slice(0, 2) === '{"' &&
          (name.slice(-2) === '"}' || value.slice(-2) === '"}')
        ) {
          name = name.replace(/\s/g, '+')

          if (value.slice(0, 1) === '=') value = '=' + value

          return Object.assign(para, JSON.parse(name + value))
        }
      }

      if (typeof value === 'string') {
        value = xss ? value.xss() : value
      }

      if (name.slice(-2) === '[]') {
        name = name.slice(0, -2)
        if (typeof value === 'string') {
          value = [value]
        }
      } else if (name.slice(-1) === ']') {
        let key = name.slice(name.lastIndexOf('[') + 1, -1)
        name = name.slice(0, name.lastIndexOf('['))

        //多解析一层对象(也仅支持到这一层)
        if (name.slice(-1) === ']') {
          let pkey = name.slice(name.lastIndexOf('[') + 1, -1)
          name = name.slice(0, name.lastIndexOf('['))

          if (!para.hasOwnProperty(name)) {
            para[name] = {}
          }

          if (!para[name].hasOwnProperty(pkey)) {
            para[name][pkey] = {}
          }

          para[name][pkey][key] = value
        } else {
          if (!para.hasOwnProperty(name)) {
            para[name] = {}
          }

          para[name][key] = value
        }
        return
      }

      para[name] = value
    })

    form.on('file', (name, file) => {
      if (name.slice(-2) === '[]') {
        name = name.slice(0, -2)
      }
      if (!para.hasOwnProperty(name)) {
        para[name] = file
      } else {
        if (!Array.isArray(para[name])) {
          para[name] = [para[name]]
        }
        para[name].push(file)
      }
    })

    form.on('error', out.reject)

    form.on('end', err => {
      for (let i in para) {
        if (typeof para[i] === 'string') {
          if (!para[i]) {
            continue
          }
          if (para[i].startsWith(0) && !para[i].startsWith('0.')) {
            continue
          } else if (isFinite(para[i])) {
            para[i] = +para[i]
          }
        }
      }
      this._postParam = para
      if (key) {
        return out.resolve(para.hasOwnProperty(key) ? para[key] : null)
      } else {
        return out.resolve(para)
      }
    })
    return out.promise
  }

  //获取响应头
  header(key) {
    key = (key + '').toLowerCase()
    return !!key ? this.origin.req.headers[key] : this.origin.req.headers
  }

  //获取客户端IP
  ip() {
    return (
      this.header('x-real-ip') ||
      this.header('x-forwarded-for') ||
      this.origin.req.connection.remoteAddress.replace('::ffff:', '')
    )
  }
}

module.exports = Request
