const asyncHooks = require('async_hooks')
const NameSpace = require('./namespace')

const namespaces = {}

const createHooks = namespace => {
  asyncHooks.createHook({
    init: (asyncId, type, triggerId, resource) => {
      if (namespace.context[triggerId]) {
        namespace.context[asyncId] = namespace.context[triggerId]
      }
    },

    destroy: asyncId => {
      delete namespace.context[asyncId]
    }
  })
    .enable()
}

module.exports = {
  createNameSpace: name => {
    if (namespaces[name]) {
      throw new Error(`A namespace for ${name} is already exists`)
    }

    const namespace = new NameSpace()
    namespaces[name] = namespace
    createHooks(namespace)
    return namespace
  },

  getNameSpace: name => {
    return namespaces[name]
  }
}
