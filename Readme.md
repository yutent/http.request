![module info](https://nodei.co/npm/http.request.png?downloads=true&downloadRank=true&stars=true)

# http.request

> `http.request` is a module that let you can easily using on http server. 



## Install
```bash
    npm install http.request
```



## Usage
```javascript

let Request = require('http.request'),
    http = require('http');


    http.createServer((req, res) => {

    
        let request = new Request(req, res);

        // it eq. argument req
        console.log(request.req)
        
        // print the fixed url
        console.log(request.url)
        
        request.ip() // get client ip address
        
        // http://test.com/?foo=bar
        request.get('foo') // bar


    }).listen(3000)


```




## API

### get([key[,xss]])
- key `<String>` optional
- xss `<Boolean>` optional

> Get the fieldset from url. Just like PHP's $_GET[];
> 
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
- key `<String>` optional
- xss `<Boolean>` optional

> Get the http body content, just like PHP's $_POST[].
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
    

### headers([key])
- key `<String>` optional

> return http headers.

```javascript
request.headers('user-agent') // Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...

// return all if not yet argument given
request.headers() // {'user-agent': '...'[, ...]}
```
    
    
    
### ip()
> return the client IP address.
> 
> It would return '127.0.0.1' maybe if in local area network.


