/* eslint-disable no-undef */

const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert')
const expressTest = require('express')
const httpRequestContext = require('../index')
const { port, sleep } = require('./common')

const expressApp = expressTest()

chai.use(chaiHttp)

describe('Express Middleware Test', function () {
  it('Express return 200 and correct value', async function () {
    expressApp.use(httpRequestContext.middleware({
      interval: 0.2,
      expire: 0.1
    }))

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

    const server = expressApp.listen(port)

    const response = await chai.request(server).get('/')

    await sleep() // ensure callstack remove

    server.close()

    assert.strictEqual(200, response.status)
    assert.strictEqual('value', response.text)
  })
})
