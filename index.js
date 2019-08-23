const nameSpace = require('./hook')

const ns = nameSpace.createNameSpace('__HTTP_REQUEST_CONTEXT__')

ns.middleware = (req, res, next) => {
  ns.init()
  next()
}

module.exports = ns

