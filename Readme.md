![module info](https://nodei.co/npm/http.request.png?downloads=true&downloadRank=true&stars=true)

# http.request

> `http.request` is a module that let you can easily using on http server.

## Install

```bash
    npm i http.request
```

## Usage

```javascript
let Request = require('http.request')
let http = require('http')

http
  .createServer((req, res) => {
    let request = new Request(req, res)

    console.log(request.origin) // {req, res}

    // print the fixed url
    console.log(request.url)

    request.ip() // get client ip address

    // http://test.com/?foo=bar
    request.get('foo') // bar
  })
  .listen(3000)
```

## API

### origin 
> return the origin request object and response object.

```js
console.log(request.origin) // {req: request, res: response}
```


### app
> return this first part of url

```js
// abc.com/foo/bar
console.log(request.app) // foo
```


### path
> return this extra part of url

```js
// abc.com/foo/bar/aa/bb
console.log(request.path) // ['bar', 'aa', 'bb']
```

### url
> return this fixed url

```js
// abc.com/foo/bar/aa/bb
// abc.com////foo///bar/aa/bb
console.log(request.url) // foo/bar/aa/bb
```

### router
> return this router params

```js
// abc.com/foo/bar/aa/bb/xx/yy
console.log(request.router) // {aa: 'bb', xx: 'yy'}
```



### get([key[,xss]])

* key `<String>` optional
* xss `<Boolean>` optional

> Get the fieldset from url. Just like PHP's `$_GET[]`;
> If `xss` is set to be true, the result will be filtered out with base xss.

```javascript
// http://test.com?name=foo&age=18
request.get('name') // foo
request.get('age') // 18

// return all if not yet argument given
request.get() // {name: 'foo', age: 18}
request.get('weight') // return null if not exists
```

### post([key[,xss]])

* key `<String>` optional
* xss `<Boolean>` optional

> Get the http body content, just like PHP's `$_POST[]`.
>
> **this function must use await/yiled command**

```javascript
// http://test.com
await request.post('name') // foo
await request.post('age') // 18

// return all if not yet argument given
await request.post() // {name: 'foo', age: 18}
await request.post('weight') // return null if not exists
```

### header([key])

* key `<String>` optional

> return http headers.

```javascript
request.header('user-agent') // Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...

// return all if not yet argument given
request.header() // {'user-agent': '...'[, ...]}
```

### ip()

> return the client IP address.
>
> It would return '127.0.0.1' maybe if in local area network.
