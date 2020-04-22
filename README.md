# HTTP Request Context

[![npm package](https://nodei.co/npm/http-request-context.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/http-request-context)

[![Build Status](https://travis-ci.org/zhujun24/http-request-context.svg)](https://travis-ci.org/zhujun24/http-request-context)
[![Coverage Status](https://coveralls.io/repos/github/zhujun24/http-request-context/badge.svg?branch=master)](https://coveralls.io/github/zhujun24/http-request-context?branch=master)
[![Known Vulnerabilities](https://snyk.io//test/github/zhujun24/http-request-context/badge.svg?targetFile=package.json)](https://snyk.io//test/github/zhujun24/http-request-context?targetFile=package.json)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fzhujun24%2Fhttp-request-context?ref=badge_shield)
[![npm package](https://img.shields.io/npm/v/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)

[![NPM downloads](https://img.shields.io/npm/dm/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)
[![Dependency Status](https://david-dm.org/zhujun24/http-request-context.svg)](https://www.npmjs.com/package/http-request-context)
[![Dependency Status](https://david-dm.org/zhujun24/http-request-context/dev-status.svg)](https://www.npmjs.com/package/http-request-context)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://www.npmjs.com/package/http-request-context)

Set and Get request-scoped context anywhere.

## Requirement

### Nodejs version >= 8.2.0

This module uses the newer [async_hooks](https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md) API which is considered `Experimental` by Nodejs.

## Options

| Option | Description | Type | Default |
|:------------|:------------|:------------|:------------|
| interval | remove expired callstack interval(s) | Number | 10
| expire | callstack expire time(s)| Number | 150
| removeAfterFinish | remove callstack after [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) [finish](https://nodejs.org/api/http.html#http_event_finish) | Boolean | false
| removeAfterClose | remove callstack after [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) [close](https://nodejs.org/api/http.html#http_event_close_1) | Boolean | false

#### options.interval

Remove expired callstack interval, used like `setInterval(removeExpiredCallstack, interval)`.

#### options.expire

Callstack expire time, must be longer than full lifecycle of a request.

#### options.removeAfterFinish

It will actively remove the relevant callstack after [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) [finish](https://nodejs.org/api/http.html#http_event_finish).

If set to `true`, you can get the context synchronously in the finish event, but not asynchronous. The benefit is that it can improve the performance of this middleware.

#### options.removeAfterClose

This is very similar to `options.removeAfterFinish`, the difference is that after the close event.

Please Note! if set to `true`, in some cases, the close event may be caused by the client terminating the request, after the close event, we may still use the context after the incomplete asynchronous operation is completed, this will result in loss of context.

## Init Middleware

**Do not use any middleware that contains asynchronous operations before this middleware.**

- `httpRequestContext.middleware(options)` Init Express middleware.
- `httpRequestContext.koaMiddleware(options)` Init Koa middleware.

## Set Context

- `httpRequestContext.set(key, value)` Set context anywhere.
- `httpRequestContext.set({ key: value })` This is also OK.

## Get Context

- `httpRequestContext.get(key)` Get the `[key]` attribute of the context.
- `httpRequestContext.get()` Gets an object containing all context properties.

## How to Use

see [example](https://github.com/zhujun24/http-request-context/tree/master/example) here.

### Install

```npm
npm install http-request-context --save
```

### Express

##### Init

```js
import httpRequestContext from 'http-request-context'

app.use(httpRequestContext.middleware())
```

##### Set Context

```js
import httpRequestContext from 'http-request-context'

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
import httpRequestContext from 'http-request-context'

httpRequestContext.get('foo') // 'bar'
```

### Koa

##### Init

```js
import httpRequestContext from 'http-request-context'

app.use(httpRequestContext.koaMiddleware())
```

##### Set Context

```js
import httpRequestContext from 'http-request-context'

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
import httpRequestContext from 'http-request-context'

httpRequestContext.get('foo') // 'bar'
```

## Lost Context Tips

#### http.ServerResponse close event

Sometimes, when client terminal request by close window or reload page, it will cause http.ServerResponse emit 'close' event, this event is trigger by root, so it break away from current request scope, in this case, we can add `res`(express) or `ctx.res`(koa) parameter to get context function to ensure context can be tracked, as follows:

```js
// Express
res.on('close', () => {
  console.log('close', httpRequestContext.get('foo', res))
})

// Koa
ctx.res.on('close', () => {
  console.log('close', httpRequestContext.get('foo', ctx.res))
})
```

#### MySQL

If you init mysql connect before http server start, you may get context undefined in mysql query callback scope.

[googleapis/cloud-trace-nodejs #946](https://github.com/googleapis/cloud-trace-nodejs/issues/946)

[nodejs/node #22360](https://github.com/nodejs/node/issues/22360)

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
