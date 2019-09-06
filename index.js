const asyncHooks = require('async_hooks')

const contexts = {} // all callstack map
const rootAsyncIdQueueMap = {} // request root callstack
const INTERVAL = process.env.HTTP_REQUEST_CONTEXT_INTERVAL || 10000 // remove expired context interval
const ASYNC_ID_TIMEOUT = process.env.HTTP_REQUEST_CONTEXT_TIMEOUT || 150000 // context expire time (must be longer than full cycle of a request)

// delete asyncId map 60s ago every second
const interval = () => {
  setTimeout(interval, INTERVAL)

  const now = Date.now()

  for (const asyncId of Object.keys(contexts)) {
    if (now - contexts[asyncId].__tm < ASYNC_ID_TIMEOUT) {
      break
    } else {
      delete contexts[asyncId]
    }
  }
}
setTimeout(interval, INTERVAL)

// find callstack root
const findRootId = (id) => {
  if (!id) {
    return
  }
  if (contexts[id]) {
    if (contexts[id].data) {
      return id
    }
    return findRootId(contexts[id].id)
  }
}

// find TCPWrap root
const findTCPWrapAsyncId = asyncId => {
  if (contexts[asyncId]) {
    if (contexts[asyncId].type === 'TCPWRAP') {
      return asyncId
    }
    return findTCPWrapAsyncId(asyncId - 1)
  }
}

asyncHooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    const executionAsyncId = asyncHooks.executionAsyncId()

    contexts[asyncId] = {
      id: executionAsyncId,
      type,
      __tm: Date.now()
    }

    const rootId = findRootId(executionAsyncId)
    if (rootId && rootAsyncIdQueueMap[rootId]) {
      rootAsyncIdQueueMap[rootId].push(asyncId)
    }
  },
  destroy (asyncId) {
    // delete root & all callstack
    if (rootAsyncIdQueueMap[asyncId]) {
      delete contexts[asyncId]
      rootAsyncIdQueueMap[asyncId].forEach(id => {
        delete contexts[id]
      })
      delete rootAsyncIdQueueMap[asyncId]
    }
  }
}).enable()

const middleware = () => {
  const executionAsyncId = asyncHooks.executionAsyncId()
  const rootId = findTCPWrapAsyncId(executionAsyncId)
  contexts[rootId].data = {}
  contexts[executionAsyncId] = {
    id: rootId,
    __tm: Date.now()
  }
  rootAsyncIdQueueMap[rootId] = [executionAsyncId]
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
    if (rootId) {
      Object.assign(contexts[rootId].data, { [key]: value })
    }
  },
  get: (key) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    if (rootId) {
      return contexts[rootId].data[key]
    }
  }
}
