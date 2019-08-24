const asyncHooks = require('async_hooks')

let topAsyncId = -1

class NameSpace {
  constructor() {
    this.activeContext = null
    this.contextList = []
    this.contexts = new Map()
  }

  set(key, val) {
    if (!this.activeContext) {
      throw new Error('No active context available.')
    }
    this.activeContext[key] = val
    return true
  }

  get(key) {
    if (!this.activeContext) {
      return undefined
    }
    return this.activeContext[key]
  }

  createContext() {
    return this.activeContext || {}
  }

  init() {
    this.enter(this.createContext())
  }

  enter(context) {
    this.contextList.push(this.activeContext)
    this.activeContext = context
  }

  exit(context) {
    if (this.activeContext === context) {
      this.activeContext = this.contextList.pop()
      return
    }

    const index = this.contextList.lastIndexOf(context)
    if (~index) {
      this.contextList.splice(index, 1)
    }
  }
}

module.exports = () => {
  const namespace = new NameSpace();

  asyncHooks.createHook({
    init: (asyncId, type, triggerId, resource) => {
      topAsyncId = asyncHooks.executionAsyncId()

      if (namespace.activeContext) {
        namespace.contexts.set(asyncId, namespace.activeContext)
      } else if (topAsyncId === 0) {
        // CurrentId will be 0 when triggered from C++. Promise events
        // https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md#triggerid
        const triggerId = asyncHooks.triggerAsyncId()
        const triggerIdContext = namespace.contexts.get(triggerId)
        if (triggerIdContext) {
          namespace.contexts.set(asyncId, triggerIdContext)
        }
      }
    },

    before: asyncId => {
      topAsyncId = asyncHooks.executionAsyncId()

      const context = namespace.contexts.get(asyncId) || namespace.contexts.get(topAsyncId)
      if (context) {
        namespace.enter(context)
      }
    },

    after: asyncId => {
      topAsyncId = asyncHooks.executionAsyncId()

      const context = namespace.contexts.get(asyncId) || namespace.contexts.get(topAsyncId)
      if (context) {
        namespace.exit(context)
      }
    },

    destroy: asyncId => {
      topAsyncId = asyncHooks.executionAsyncId()

      namespace.contexts.delete(asyncId)
    }
  })
    .enable()

  return namespace
}
