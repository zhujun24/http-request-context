const asyncHooks = require('async_hooks')

const contexts = {} // all callstack map
const rootAsyncIdQueueMap = {} // request root callstack
const INTERVAL = process.env.HTTP_REQUEST_CONTEXT_INTERVAL || 10000 // remove expired context interval
const ASYNC_ID_TIMEOUT = process.env.HTTP_REQUEST_CONTEXT_TIMEOUT || 150000 // context expire time (must be longer than full cycle of a request)

// delete asyncId map 60s ago every second
const interval = () => {
  setTimeout(interval, INTERVAL)

  const now = Date.now()
  const asyncIds = Object.keys(contexts)
  asyncIds.shift() // skip first TCPWRAP asyncId

  for (const asyncId of asyncIds) {
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

asyncHooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    contexts[asyncId] = {
      id: asyncHooks.executionAsyncId(),
      __tm: Date.now()
    }

    if (type === 'TCPWRAP') {
      // app start rootId
      rootAsyncIdQueueMap[asyncId] = []
    }

    // push asyncId to root callstack
    const rootID = findRootId(asyncId)
    if (rootID) {
      rootAsyncIdQueueMap[rootID].push(asyncId)
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
    if (!findRootId(asyncId)) {
      delete contexts[asyncId]
    }
  }
}).enable()

module.exports = {
  middleware: (req, res, next) => {
    const executionAsyncId = asyncHooks.executionAsyncId()
    contexts[executionAsyncId].data = {}
    rootAsyncIdQueueMap[executionAsyncId] = []
    next()
  },
  koaMiddleware: async (ctx, next) => {
    const executionAsyncId = asyncHooks.executionAsyncId()
    contexts[executionAsyncId].data = {}
    rootAsyncIdQueueMap[executionAsyncId] = []
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
