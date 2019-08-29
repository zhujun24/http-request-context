# HTTP Request Context

[![npm package](https://nodei.co/npm/http-request-context.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/request/)

[![npm package](https://img.shields.io/npm/v/http-request-context.svg?style=flat-square)](https://www.npmjs.org/package/http-request-context)
[![NPM downloads](https://img.shields.io/npm/dm/http-request-context.svg?style=flat-square)](https://npmjs.org/package/http-request-context)
[![Dependency Status](https://david-dm.org/zhujun24/http-request-context.svg?style=flat-square)](https://david-dm.org/zhujun24/http-request-context)

Get and set request-scoped context anywhere.

## How to Use

Install: `npm install http-request-context --save`

### Express

#### Init

```js
const httpRequestContext = require('http-request-context')

app.use(httpRequestContext.middleware)
```

### Set Context

```js
const httpRequestContext = require('http-request-context')

// set context by key-value
app.use((req, res, next) => {
  setTimeout(() => {
    httpRequestContext.set('foo', 'bar')
    next()
  }, 100)
})
```

### Get Context

```js
const httpRequestContext = require('http-request-context')

httpRequestContext.get('foo') // 'bar'
```

### Koa

#### Init

```js
const httpRequestContext = require('http-request-context')

app.use(httpRequestContext.koaMiddleware)
```

### Set Context

```js
const httpRequestContext = require('http-request-context')

// set context by key-value
app.use(async (ctx, next) => {
  await new Promise(resolve => {
    setTimeout(() => {
      httpRequestContext.set('user', 'user')
      resolve()
    }, 300)
  })
  await next()
})
```

### Get Context

```js
const httpRequestContext = require('http-request-context')

httpRequestContext.get('foo') // 'bar'
```

## Tips

### MySQL

If you init mysql connect before http server start, you may get context undefined in mysql query callback scope.

```js
mysqlConnection.query('SELECT * FROM table', (error, results, fields) => {
  httpRequestContext.get('foo') // undefined
})
```

You can use util.promisify to avoid it.

```js
util.promisify(mysqlConnection.query).bind(mysqlConnection)('SELECT * FROM table')
  .then((results, fields) => {
    httpRequestContext.get('foo') // 'bar'
  })
  .catch(error => {})
```

## TODO

- [ ] Get undefined in koa close callback
- [ ] Get undefined in borderline case
