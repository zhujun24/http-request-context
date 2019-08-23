const asyncHooks = require('async_hooks')

module.exports = class NameSpace {

  constructor() {
    this.context = {}
  }

  init(fn) {
    const asyncId = asyncHooks.executionAsyncId()
    this.context[asyncId] = {}
    fn && fn()
  }

  set(key, val) {
    const asyncId = asyncHooks.executionAsyncId()
    const context = this.context[asyncId]
    if (!context) {
      return
    }
    context[key] = val
    return true
  }

  get(key) {
    const asyncId = asyncHooks.executionAsyncId()
    const context = this.context[asyncId]
    if (!context) {
      return
    }
    return context[key]
  }

}
