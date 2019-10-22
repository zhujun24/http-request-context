const util = require('util')
const express = require('express')
const httpRequestContext = require('../')

const app = express()

app.use(httpRequestContext.middleware())

app.use((req, res, next) => {
  httpRequestContext.set('name', 'zhujun24')
  res.on('close', () => {
    console.log('close', httpRequestContext.get('name'))
  })
  res.on('finish', () => {
    console.log('finish', httpRequestContext.get('name'))
  })
  next()
})

app.use((req, res, next) => {
  setTimeout(() => {
    httpRequestContext.set('sex', 'male')
    next()
  }, 300)
})

app.use((req, res, next) => {
  util.promisify(process.nextTick)().then(() => {
    httpRequestContext.set('age', '24')
    next()
  })
})

app.all('*', (req, res) => {
  res.send({
    name: httpRequestContext.get('name'),
    sex: httpRequestContext.get('sex'),
    age: httpRequestContext.get('age')
  })
})

app.listen(3001)
