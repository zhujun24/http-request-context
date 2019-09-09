# HTTP Request Context

[![npm package](https://nodei.co/npm/http-request-context.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/http-request-context)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context?ref=badge_shield)

[![Build Status](https://travis-ci.org/zhujun24/http-request-context.svg)](https://travis-ci.org/zhujun24/http-request-context)
[![Coverage Status](https://coveralls.io/repos/github/zhujun24/http-request-context/badge.svg?branch=master)](https://coveralls.io/github/zhujun24/http-request-context?branch=master)
[![npm package](https://img.shields.io/npm/v/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)
[![NPM downloads](https://img.shields.io/npm/dm/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)
[![Dependency Status](https://david-dm.org/zhujun24/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)
[![Dependency Status](https://david-dm.org/zhujun24/http-request-context/dev-status.svg)](https://www.npmjs.com/package/http-request-context)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://www.npmjs.com/package/http-request-context)

Set and get request-scoped context anywhere.

## Requirement

### Nodejs version >= 8.2.0

This module uses the newer [async_hooks](https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md) API which is considered `Experimental` by Nodejs.

## Parameter

Parameter configuration must be require before, but normally no config are required.

| Name | Description | Default |
|:------------|:------------|:------------|
| process.env.HTTP_REQUEST_CONTEXT_INTERVAL | remove expired callstack interval(ms) | 10000
| process.env.HTTP_REQUEST_CONTEXT_EXPIRE | callstack expire time(ms)| 150000

## Middleware

- `httpRequestContext.middleware` Express middleware.
- `httpRequestContext.koaMiddleware` Koa middleware.

## Set Context

- `httpRequestContext.set(key, value)` Set context anywhere.
- `httpRequestContext.set({ key: value })` This is also OK.

## Get Context

- `httpRequestContext.get(key)` Get the `[key]` attribute of the context.
- `httpRequestContext.get()` Gets an object containing all context properties.

## Example

see [example](https://github.com/zhujun24/http-request-context/tree/master/example)

## How to Use

Install: `npm install http-request-context --save`

### Express

##### Init

```js
const httpRequestContext = require('http-request-context')

app.use(httpRequestContext.middleware)
```

##### Set Context

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

##### Get Context

```js
const httpRequestContext = require('http-request-context')

httpRequestContext.get('foo') // 'bar'
```

### Koa

##### Init

```js
const httpRequestContext = require('http-request-context')

app.use(httpRequestContext.koaMiddleware)
```

##### Set Context

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

##### Get Context

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


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context?ref=badge_large)