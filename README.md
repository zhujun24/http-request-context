# HTTP Request Context

Get and set request-scoped context anywhere.

## How to Use

Install: `npm install http-request-context --save`

### Init in middleware

```js
const express = require('express')
const httpRequestContext = require('http-request-context')

const app = express()

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
