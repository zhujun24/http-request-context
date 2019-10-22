/* eslint-disable no-undef */

const chai = require('chai')
const chaiHttp = require('chai-http')
const express = require('express')
const httpRequestContext = require('../index')
const { port, sleep } = require('./common')

const expressApp = express()

chai.use(chaiHttp)

describe('removeAfterClose Test', function () {
  it('options.removeAfterClose', function (done) {
    expressApp.use(httpRequestContext.middleware({ removeAfterClose: true }))

    expressApp.use(function (req, res, next) {
      setTimeout(() => {
        res.connection.destroy()
      }, 20)
    })

    const server = expressApp.listen(port)

    chai.request(server)
      .get('/')
      .end(function () {
        sleep().then(() => {
          server.close()
          done()
        })
      })
  })
})
