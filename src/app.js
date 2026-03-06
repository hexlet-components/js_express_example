import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import morgan from 'morgan'
import debug from 'debug'
import session from 'express-session'
import methodOverride from 'method-override'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const httpLog = debug('app:http')
const dbLog = debug('app:db')

class AccessDeniedError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.status = 403
  }
}

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(morgan(':method :url :status :response-time'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

app.use(session({
  secret: 'hexlet-secret',
  resave: false,
  saveUninitialized: false,
}))

// flash middleware: stores messages in session and clears them after read
app.use((req, res, next) => {
  const flashMessages = req.session.flash ?? []
  res.locals.flash = flashMessages
  req.session.flash = []
  res.flash = (type, message) => {
    req.session.flash = req.session.flash ?? []
    req.session.flash.push({ type, message })
  }
  next()
})

const basedir = __dirname
const staticPath = path.join(basedir, 'static')
app.use('/assets', express.static(staticPath))

let requestCounter = 0
app.use((req, res, next) => {
  requestCounter += 1
  req.requestCounter = requestCounter
  req.requestTime = Date.now()
  next()
})

app.use((req, res, next) => {
  const currentUser = req.session.user ?? { role: 'guest' }
  res.locals.currentUser = {
    ...currentUser,
    isGuest: () => currentUser.role === 'guest',
  }
  next()
})

const requiredAuth = (req, res, next) => {
  if (res.locals.currentUser.isGuest()) {
    return next(new AccessDeniedError())
  }
  return next()
}

const notes = []
let nextNoteId = 1
let posts = [
  { id: 1, title: 'First post' },
  { id: 2, title: 'Second post' },
]

app.get('/', (req, res) => {
  httpLog('GET / counter=%d', req.requestCounter)
  res.render('index', {
    requestCounter: req.requestCounter,
    requestTime: new Date(req.requestTime).toISOString(),
    sessionCounter: req.session.counter ?? 0,
    posts,
  })
})

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, page: req.query.page ?? null })
})

app.get('/increment', (req, res) => {
  req.session.counter = req.session.counter ?? 0
  req.session.counter += 1
  res.json({ counter: req.session.counter })
})

app.get('/template-demo', (req, res) => {
  res.render('template-demo', {
    title: 'Template demo',
    items: ['routing', 'templates', 'flash'],
  })
})

app.get('/session/login', (req, res) => {
  req.session.user = { role: 'user' }
  res.flash('success', 'Вы вошли как пользователь')
  res.redirect('/')
})

app.delete('/posts/:id', requiredAuth, (req, res) => {
  const postId = Number(req.params.id)
  posts = posts.filter(post => post.id !== postId)
  res.flash('success', `Пост ${postId} удален`)
  res.redirect('/')
})

app.post('/users', (req, res) => {
  res.flash('success', 'Пользователь создан')
  res.redirect('/')
})

app.get('/api/notes', (req, res) => {
  res.json(notes)
})

app.post('/api/notes', (req, res) => {
  const { text } = req.body
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(422).json({ error: 'text is required' })
  }

  const note = { id: nextNoteId, text }
  nextNoteId += 1
  notes.push(note)
  dbLog('created note id=%d', note.id)
  return res.status(201).json(note)
})

app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === Number(req.params.id))
  if (!note) {
    return res.status(404).json({ error: 'Note not found' })
  }
  return res.json(note)
})

app.get('/boom', (req, res, next) => {
  next(new Error('Something went wrong'))
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, _next) => {
  const status = err.status ?? 500
  res.status(status).json({ error: err.message })
})

export default app
