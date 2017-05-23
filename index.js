/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-16 18:27:29
 *
 */

"use strict";
const Parser = require('./lib'),
    FS = require('iofs'),
    URL = require('url'),
    QS = require('querystring'),
    tmpdir = __dirname + '/.tmp/';


class Request {

    constructor(req, res){
        this.req = req
        this.res = res
        this._getParam = null
        this._postParam = null
        this.method = req.method
        this._fixUrl()

        //把判断放到
        if(!FS.isdir(tmpdir)){
            FS.mkdir(tmpdir)
        }else{
            //清除2个小时前的所有临时文件
            let list = FS.ls(tmpdir)
            list.forEach(it => {
                if(FS.stat(tmpdir + it).atime < Date.now() - 7200000)
                    FS.rm(tmpdir + it)
            })
        }
    }

    //修正请求的url
    _fixUrl(){
        let _url = URL.parse(this.req.url).pathname.slice(1).replace(/[\/]+$/, '')
        let _route = ''

        if(/[^\w\-\/\.]/.test(_url)){
            this.res.writeHead(401, {'X-debug': 'url[' + _url + '] contains illegal characters'})
            return this.res.end('')
        }
        
        //修正url中可能出现的"多斜杠",并跳转到修正后的地址
        let pathFixed = _url.replace(/[\/]+/g, '/').replace(/^\//, '');
        if(pathFixed !== _url){
            this.res.writeHead(301, {'Location': `//${this.req.headers.host}/${pathFixed}`})
            return this.res.end()
        }

        let pathArr = _url.split('/')
        if(!pathArr[0] || pathArr[0] === '')
            pathArr[0] = 'index'

        if(pathArr[0].indexOf('.') !== -1){
            _route = pathArr[0].slice(0, pathArr[0].indexOf('.'))
            //如果_route为空(这种情况一般是url前面带了个"."造成的),则自动默认为index
            if(!_route || _route === '')
                _route = 'index'
        }else{
            _route = pathArr[0]
        }

        pathArr.shift()

        this.url = _url
        this.path = pathArr
        this.app = _route
    }

    /**
     * [get 同php的$_GET]
     */
    get(key = '', xss = true){
        xss = !!xss
        if(!this._getParam){
            let para = URL.parse(this.req.url).query
            para = Object.assign({}, QS.parse(para))
            if(xss){
                for(let i in para){
                    para[i] = para[i].trim().xss();

                    if(!para[i]){
                        continue
                    }

                    if(para[i].startsWith(0) && !para[i].startsWith('0.'))
                        continue
                    else if(isFinite(para[i]))
                        para[i] = +para[i]
                }
            }
            this._getParam = para
        }
        
        return key ? (this._getParam.hasOwnProperty(key) ? this._getParam[key] : null) : this._getParam
    }

    /**
     * [post 接收post, 需要 yield ]
     * @param  {Str}    key      [字段]
     */
    post(key = '', xss = true){

        let para = {}
        xss = !!xss

        //如果之前已经缓存过,则直接从缓存读取
        if(this._postParam){
            if(key)
                return this._postParam.hasOwnProperty(key) ? this._postParam[key] : null
            else
                return this._postParam
        }

        return new Promise((yes, no) => {
            let form = new Parser()
            form.uploadDir = tmpdir
            form.parse(this.req)

            form.on('field', (name, value) => {
                if(/urlencoded/i.test(this.headers('content-type'))){
                    if(name.slice(0, 2) === '{"' && (name.slice(-2) === '"}' || value.slice(-2) === '"}')){

                        name = name.replace(/\s/g, '+')

                        if(value.slice(0, 1) === '=')
                            value = '=' + value

                        return Object.assign(para, JSON.parse(name + value))
                    }
                }

                if(typeof value === 'string')
                    value = xss ? value.xss() : value

                if(name.slice(-2) === '[]'){
                    name = name.slice(0, -2)
                    if(typeof value === 'string')
                        value = [value]

                }else if(name.slice(-1) === ']'){
                    let key = name.slice(name.lastIndexOf('[') + 1, -1)
                    name = name.slice(0, name.lastIndexOf('['))

                    //多解析一层对象(也仅支持到这一层)
                    if(name.slice(-1) === ']'){
                        let pkey = name.slice(name.lastIndexOf('[') + 1, -1)
                        name = name.slice(0, name.lastIndexOf('[')) 

                        if(!para.hasOwnProperty(name))
                            para[name] = {}

                        if(!para[name].hasOwnProperty(pkey))
                            para[name][pkey] = {}

                        para[name][pkey][key] = value

                    }else{
                        if(!para.hasOwnProperty(name))
                            para[name] = {}
                        
                        para[name][key] = value
                    }
                    return
                }

                para[name] = value
                
            })

            form.on('file', (name, file) => {
                if(name.slice(-2) === '[]'){
                    name = name.slice(0, -2)
                }
                if(!para.hasOwnProperty(name)){
                    para[name] = file
                }else{
                    if(!Array.isArray(para[name])){
                        para[name] = [para[name]]
                    }
                    para[name].push(file)
                }
            })

            form.on('error', no)

            form.on('end', err => {
                for(let i in para){
                    if(typeof para[i] === 'string'){
                        if(!para[i]){
                            continue
                        }
                        if(para[i].startsWith(0) && !para[i].startsWith('0.'))
                            continue
                        else if(isFinite(para[i]))
                            para[i] = +para[i]
                    }
                }
                this._postParam = para
                if(key)
                    return yes(para.hasOwnProperty(key) ? para[key] : null)
                else
                    return yes(para)
            })
        })

    }

    //获取响应头
    headers(key){
        key = (key + '').toLowerCase()
        return !!key ? this.req.headers[key] : this.req.headers
    }

    //获取客户端IP
    ip(){
        return this.headers('x-real-ip') || this.headers('x-forwarded-for') || this.req.connection.remoteAddress.replace('::ffff:', '')
    }




}



module.exports = Request