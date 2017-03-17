![module info](https://nodei.co/npm/http.request.png?downloads=true&downloadRank=true&stars=true)

# request 对象
> request对象是对`httpServer`回调中的req参数进一步的封装和解析，并把一些最常用的属性和方法，暴露出来。
 每一次网络请求，request对象，会自动挂载到控制器`Controller`类上， 可以通过 this.request 访问到。

## 属性

### １. req
> 该属性即为`httpServer`回调中的req参数，　方便在提供的API方法不满足需求的时候，自行调用。





### ２. url
> 该属性为修正后的url(不包含域名)，　即url上的非法字符，以及多斜杠，都会被修正后保存。如　`test.com/foo///bar` 会被修正为　`test.com/foo/ba`r。 `test.com/@$%!~<script>`　会被修正为 `test.com/`。
默认只允许出现　`[\w-\.\/]` 这些合法字符，当然，query部分不受此限制，即　`test.com?foo=$#@!#@$%^&bar=哈哈` 这样子的url是规则允许的。

## API

### 1. get([key[,xss]])
- key `<String>` 可选
- xss `<Boolean>` 可选

> get方法，类似于PHP的$_GET，用于获取url上的参数（query部分）。
可接收2个参数，key为键名，为必填项; xss可指定是否进行xss过滤， 默认为true。

```javascript
// http://test.com?name=foo&age=18
request.get('name') // foo
request.get('age') // 18
request.get() // {name: 'foo', age: 18} 不传key则返回全部
request.get('weight') // null 不存在返回 null
```



### 2. post([key[,xss]])
- key `<String>` 可选
- xss `<Boolean>` 可选
> post方法，顾名思义，就是接收POST上来的数据，类似于PHP的$_POST。
同样可以接收2个参数，键名和是否xss过滤，不同的是，post方法的使用，需要加上 `await`  才可以。
`还有一点很重要的是，post方法，一次网络请求只能使用一次`

```javascript
// http://test.com
await request.post('name') // foo
await request.post('age') // 18
await request.post() // {name: 'foo', age: 18} 不传key则返回全部
await request.post('weight') // null 不存在返回 null
```
    
### 3. headers([key])
- key `<String>` 可选
> headers方法，用于获取请求头信息， 参数key为选，不填则返回全部头信息。
`key`不分大小写，若留空，返回的`Object`中的键名，均为小写。

```javascript
request.headers('user-agent') // Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...
request.headers() // {'user-agent': '...'[, ...]} 返回所有
```
    
    
    
### 4. ip()
> 顾名思义，就是获取客户端的IP地址，注意，项目若在内网中测试，获取到的IP一般是127.0.0.1或者内网IP段;         当且仅当项目部署在外网环境中，获取到的IP才是客户端真实的IP地址。


