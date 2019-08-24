const createNameSpace = require('./namespace')

const ns = createNameSpace('__HTTP_REQUEST_CONTEXT__')

ns.middleware = (req, res, next) => {
  ns.init()
  next()
}

module.exports = ns

