/* eslint-disable no-undef */

const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert')
const Koa = require('koa')
const httpRequestContext = require('../index')
const { port } = require('./common')

const koaApp = new Koa()

chai.use(chaiHttp)

describe('Koa Middleware Test', async function () {
  it('Koa return 200 and correct value', async function () {
    koaApp.use(httpRequestContext.koaMiddleware({
      interval: 0.2,
      expire: 0.1
    }))

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

    const server = koaApp.listen(port)

    const response = await chai.request(server).get('/')

    server.close()

    assert.strictEqual(200, response.status)
    assert.strictEqual('value', response.text)
  })
})
