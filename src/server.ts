// loads the webserver
'use strict'

import * as express from 'express'
import * as helmet from 'helmet'
const browserify = require('browserify-middleware')
import * as favicon from 'serve-favicon'
import * as path from 'path'

const app = express()
app.use(helmet())

// settings
app.set('production', process.env.NODE_ENV === 'production')
if (!app.get('production')) {
  require('dotenv').load()
}

const config = require('./config')
const mediaTypes = Object.keys(config)

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'jade')
app.use('/static', express.static(path.join(__dirname, '../public')))
app.use(favicon(path.join(__dirname, '../public/favicon.ico')))
// render the client
app.get('/static/app.js', browserify(path.join(__dirname, './client.js')))

const services: { [x: string]: any } = {
  wunderlist: require('./services/wunderlist'),
  gbooks: require('./services/google_books'),
  tmdb: require('./services/tmdb')
}

// handlers
function watcherHandler(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const mediaType = req.path.substring(5) // skips "/api/"
  let task: any
  services.wunderlist
    .fetch_tasks_by_list_id(config[mediaType].id)
    .then((tasks: any) => {
      task = tasks[Math.floor(Math.random() * tasks.length)]
      return services[config[mediaType].service].search(task.title)
    })
    .then((media: any) => {
      res.json({
        media: media,
        task: task
      })
    })
    .catch(next)
}

app.get('/', (req, res) => {
  res.render('index', {
    media_type: 'index'
  })
})

app.get(
  mediaTypes.map(r => {
    return `/${r}`
  }),
  (req, res, next) => {
    const mediaType = req.path.substring(1)
    res.render(mediaType, {
      media_type: mediaType
    })
  }
)

// get /api/:media
app.get(
  mediaTypes.map(r => {
    return `/api/${r}`
  }),
  watcherHandler
)

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(500).send(err)
  }
)

app.use((req, res, next) => {
  res
    .status(404)
    .send(
      `That's not a valid media type! Try [${mediaTypes.join(' | ')}] instead`
    )
})

const server = app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${server.address().port}`)
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`)
})