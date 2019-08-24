const createNameSpace = require('./namespace')

const ns = createNameSpace()

ns.middleware = (req, res, next) => {
  ns.init()
  next()
}

module.exports = ns

