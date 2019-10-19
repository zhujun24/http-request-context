const asyncHooks = require('async_hooks')

const TCPWRAP_NAME = 'TCPWRAP'
const callstackMap = {} // all callstack map
/* istanbul ignore next */
const CALLSTACK_REMOVE_INTERVAL = parseInt(process.env.HTTP_REQUEST_CONTEXT_INTERVAL) || 10000 // remove expired context interval
/* istanbul ignore next */
const CALLSTACK_EXPIRE = parseInt(process.env.HTTP_REQUEST_CONTEXT_EXPIRE) || 150000 // context expire time (must be longer than full cycle of a request)

// delete asyncId map 60s ago every second
const interval = () => {
  setTimeout(interval, CALLSTACK_REMOVE_INTERVAL)

  const now = Date.now()

  for (const asyncId of Object.keys(callstackMap)) {
    if (now - callstackMap[asyncId].__tm < CALLSTACK_EXPIRE) {
      break
    } else {
      delete callstackMap[asyncId]
    }
  }

  delete callstackMap[asyncHooks.executionAsyncId()]
}
setTimeout(interval, CALLSTACK_REMOVE_INTERVAL)

// find callstack root
const findRootId = id => {
  /* istanbul ignore else */
  if (callstackMap[id]) {
    if (callstackMap[id].data) {
      return id
    }
    return findRootId(callstackMap[id].id)
  }
}

// find TCPWrap root
const findTCPWrapAsyncId = asyncId => {
  /* istanbul ignore else */
  if (callstackMap[asyncId]) {
    if (callstackMap[asyncId].type === TCPWRAP_NAME) {
      return asyncId
    }
    return findTCPWrapAsyncId(asyncId - 1)
  }
}

asyncHooks.createHook({
  init (asyncId, type) {
    const executionAsyncId = asyncHooks.executionAsyncId()

    callstackMap[asyncId] = {
      id: executionAsyncId,
      type,
      __tm: Date.now()
    }
  }
}).enable()

const middleware = () => {
  const executionAsyncId = asyncHooks.executionAsyncId()
  const rootId = findTCPWrapAsyncId(executionAsyncId)
  callstackMap[rootId].data = {}
  callstackMap[executionAsyncId] = {
    id: rootId,
    __tm: Date.now()
  }
}

module.exports = {
  middleware: (req, res, next) => {
    middleware()
    next()
  },

  koaMiddleware: async (ctx, next) => {
    middleware()
    await next()
  },

  set: (key, value) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    /* istanbul ignore else */
    if (rootId) {
      const data = Object.prototype.toString.call(key) === '[object Object]' ? key : { [key]: value }
      Object.assign(callstackMap[rootId].data, data)
    }
  },

  get: key => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    /* istanbul ignore else */
    if (rootId) {
      const { data } = callstackMap[rootId]
      return typeof key === 'undefined' ? data : data[key]
    }
  }
}
