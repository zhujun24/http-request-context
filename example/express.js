const util = require('util')
const request = require('request')
const express = require('express')
const asyncHooks = require('async_hooks')
const httpRequestContext = require('../')

var app = express();

app.use(httpRequestContext.middleware);

app.use((req, res, next) => {
  const start = Date.now()
  res.on('close', () => {
    console.log('close', httpRequestContext.get('user'))
  })
  res.once('finish', () => {
    console.log('finish', asyncHooks.executionAsyncId(), httpRequestContext.get('user'), req.query)
  })
  next()
})

app.use((req, res, next) => {
  httpRequestContext.set('user', 'user')
  next();
});

app.use((req, res, next) => {
  util.promisify(process.nextTick)().then(() => {
    httpRequestContext.set('age', '99')
    next();
  })
});

app.all('*', (req, res) => {
  request('https://www.baidu.com/', () => {
    res.send(httpRequestContext.get('user'))
  })
})

app.listen(3001);
