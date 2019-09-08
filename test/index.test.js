/* eslint-disable no-undef */

process.env.HTTP_REQUEST_CONTEXT_INTERVAL = 200
process.env.HTTP_REQUEST_CONTEXT_EXPIRE = 100

const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert')
const express = require('express')
const Koa = require('koa')
const httpRequestContext = require('../')

const expressPort = 3004
const koaPort = 3005

const expressApp = express()
const koaApp = new Koa()

// Ensure timer execution and increase coverage
const sleep = () => new Promise(resolve => {
  // large than interval and timeout
  setTimeout(resolve, 300)
})

chai.use(chaiHttp)

describe('Express Middleware Test', function () {
  it('Express return 200 and correct value', async function () {
    expressApp.use(httpRequestContext.middleware)

    expressApp.use((req, res, next) => {
      setTimeout(function () {
        httpRequestContext.set('key', 'value')
        httpRequestContext.set({ improve: 'coverage' }) // improve set func coverage
        next()
      }, 50)
    })

    expressApp.use(function (req, res) {
      httpRequestContext.get() // improve get func coverage
      res.send(httpRequestContext.get('key'))
    })

    expressApp.listen(expressPort, function () {
      console.log(`Express is listening at port ${expressPort}`)
    })

    await sleep()

    const response = await chai.request(`http://127.0.0.1:${expressPort}`).get('/')

    assert.strictEqual(200, response.status)
    assert.strictEqual('value', response.text)
  })
})

describe('Koa Middleware Test', async function () {
  it('Koa return 200 and correct value', async function () {
    koaApp.use(httpRequestContext.koaMiddleware)

    koaApp.use(async (ctx, next) => {
      await new Promise(resolve => {
        setTimeout(() => {
          httpRequestContext.set('key', 'value')
          resolve()
        }, 50)
      })
      await next()
    })

    koaApp.use(ctx => {
      ctx.body = httpRequestContext.get('key')
    })

    koaApp.listen(koaPort, function () {
      console.log(`Koa is listening at port ${koaPort}`)
    })

    await sleep()

    const response = await chai.request(`http://127.0.0.1:${koaPort}`).get('/')

    assert.strictEqual(200, response.status)
    assert.strictEqual('value', response.text)
  })
})
