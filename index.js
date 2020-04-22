const asyncHooks = require('async_hooks')

const config = {}
const callstackMap = new Map() // all callstack map
const TCPWrapCallstackContainers = new Map() // request root callstack
const DEFAULT_INTERVAL = 10 // remove expired context interval
const DEFAULT_EXPIRE = 150 // callstack expire time (must be longer than full lifecycle of a request)
const RES_ROOT_ID = '__HTTP_REQUEST_CONTEXT_ROOT_ID__'

// remove callstack after request finish/close
const removeCallstackTrigger = rootId => {
  if (TCPWrapCallstackContainers.has(rootId)) {
    TCPWrapCallstackContainers.get(rootId).id.forEach(asyncId => {
      callstackMap.delete(asyncId)
    })
    TCPWrapCallstackContainers.delete(rootId)
  }
}

// remove asyncId interval
const interval = () => {
  setTimeout(interval, config.interval)

  const now = Date.now()

  for (const asyncId of callstackMap.keys()) {
    if (now - callstackMap.get(asyncId).__tm < config.expire) {
      break
    } else {
      callstackMap.delete(asyncId)
    }
  }

  for (const rootId of TCPWrapCallstackContainers.keys()) {
    if (now - TCPWrapCallstackContainers.get(rootId).__tm < config.expire) {
      break
    } else {
      removeCallstackTrigger(rootId)
    }
  }

  callstackMap.delete(asyncHooks.executionAsyncId())
}

// find callstack root
const findRootId = id => {
  const callstack = callstackMap.get(id)
  if (callstack) {
    if (callstack.data) {
      return id
    }
    return findRootId(callstack.id)
  }
}

asyncHooks.createHook({
  init (asyncId) {
    callstackMap.set(asyncId, {
      id: asyncHooks.executionAsyncId(),
      __tm: Date.now()
    })

    if (config.optimize) {
      const rootId = findRootId(asyncId)
      if (rootId && TCPWrapCallstackContainers.has(rootId)) {
        TCPWrapCallstackContainers.get(rootId).id.push(asyncId)
      }
    }
  }
}).enable()

const middleware = res => {
  const rootId = asyncHooks.executionAsyncId()
  res[RES_ROOT_ID] = rootId

  callstackMap.set(rootId, {
    id: rootId,
    data: {},
    __tm: Date.now()
  })

  if (config.optimize) {
    TCPWrapCallstackContainers.set(rootId, {
      id: [rootId],
      __tm: Date.now()
    })
  }

  if (config.removeAfterFinish) {
    res.on('finish', () => {
      process.nextTick(() => {
        removeCallstackTrigger(rootId)
      })
    })
  }

  if (config.removeAfterClose) {
    res.on('close', () => {
      process.nextTick(() => {
        removeCallstackTrigger(rootId)
      })
    })
  }
}

const initOptions = (options = {}) => {
  Object.assign(config, {
    interval: (options.interval || DEFAULT_INTERVAL) * 1000,
    expire: (options.expire || DEFAULT_EXPIRE) * 1000,
    removeAfterFinish: !!options.removeAfterFinish,
    removeAfterClose: !!options.removeAfterClose,
    optimize: !!options.removeAfterFinish || !!options.removeAfterClose
  })
}

module.exports = {
  middleware: options => {
    initOptions(options)
    interval()

    return (req, res, next) => {
      // res.set('connection', 'close')
      middleware(res)
      next()
    }
  },

  koaMiddleware: options => {
    initOptions(options)
    interval()

    return async (ctx, next) => {
      // ctx.set('connection', 'close')
      middleware(ctx.res)
      await next()
    }
  },

  set: (key, value) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    if (rootId && callstackMap.has(rootId)) {
      const data = Object.prototype.toString.call(key) === '[object Object]' ? key : { [key]: value }
      Object.assign(callstackMap.get(rootId).data, data)
    }
  },

  get: (key, res) => {
    const rootId = res && res[RES_ROOT_ID] ? res[RES_ROOT_ID] : findRootId(asyncHooks.executionAsyncId())
    if (rootId && callstackMap.has(rootId)) {
      const { data } = callstackMap.get(rootId)
      return typeof key === 'undefined' ? data : data[key]
    }
  }
}
