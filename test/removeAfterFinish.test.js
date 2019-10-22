/* eslint-disable no-undef */

const chai = require('chai')
const chaiHttp = require('chai-http')
const express = require('express')
const httpRequestContext = require('../index')
const { port, sleep } = require('./common')

const expressApp = express()

chai.use(chaiHttp)

describe('removeAfterFinish Test', function () {
  it('options.removeAfterFinish', async function () {
    expressApp.use(httpRequestContext.middleware({ removeAfterFinish: true }))

    const server = expressApp.listen(port)

    await chai.request(server).get('/')
    await sleep()

    server.close()
  })
})
