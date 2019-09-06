const util = require('util')
const Koa = require('koa')
const httpRequestContext = require('../')

const app = new Koa()

app.use(httpRequestContext.koaMiddleware)

app.use(async (ctx, next) => {
  httpRequestContext.set('name', 'zhujun24')
  ctx.res.on('close', () => {
    console.log('close', httpRequestContext.get('name'))
  })
  ctx.res.on('finish', () => {
    console.log('finish', httpRequestContext.get('name'))
  })
  await next()
})

app.use(async (ctx, next) => {
  await new Promise(resolve => {
    setTimeout(() => {
      httpRequestContext.set('sex', 'male')
      resolve()
    }, 300)
  })
  await next()
})

app.use(async (ctx, next) => {
  await util.promisify(process.nextTick)().then(() => {
    httpRequestContext.set('age', '24')
  })
  await next()
})

app.use(ctx => {
  ctx.body = {
    name: httpRequestContext.get('name'),
    sex: httpRequestContext.get('sex'),
    age: httpRequestContext.get('age')
  }
})

app.listen(3002)
