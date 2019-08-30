const util = require('util')
const express = require('express')
const httpRequestContext = require('../')

var app = express()

app.use(httpRequestContext.middleware)

app.use((req, res, next) => {
  res.on('close', () => {
    console.log('close', httpRequestContext.get('user'))
  })
  res.once('finish', () => {
    console.log('finish', httpRequestContext.get('user'))
  })
  next()
})

app.use((req, res, next) => {
  setTimeout(() => {
    httpRequestContext.set('user', 'user')
    next()
  }, 300)
})

app.use((req, res, next) => {
  util.promisify(process.nextTick)().then(() => {
    httpRequestContext.set('age', '99')
    next()
  })
})

app.all('*', (req, res) => {
  res.send({
    user: httpRequestContext.get('user'),
    age: httpRequestContext.get('age')
  })
})

app.listen(3001)
