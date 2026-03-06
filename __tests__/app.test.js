import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('app', () => {
  it('GET / returns html', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('JS Express Example')
  })

  it('GET /api/notes returns array', async () => {
    const res = await request(app).get('/api/notes')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /users/:id returns params and query', async () => {
    const res = await request(app).get('/users/42?page=3')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: '42', page: '3' })
  })

  it('GET /template-demo renders template content', async () => {
    const res = await request(app).get('/template-demo')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Template demo')
    expect(res.text).toContain('routing')
  })

  it('GET /assets/images/logo.svg serves static file', async () => {
    const res = await request(app).get('/assets/images/logo.svg')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/svg+xml')
    const svg = typeof res.text === 'string' ? res.text : res.body.toString('utf8')
    expect(svg).toContain('<svg')
  })

  it('POST /api/notes returns 422 for invalid payload', async () => {
    const res = await request(app).post('/api/notes').send({})
    expect(res.status).toBe(422)
    expect(res.body).toEqual({ error: 'text is required' })
  })

  it('POST /api/notes creates note and GET /api/notes/:id returns it', async () => {
    const created = await request(app).post('/api/notes').send({ text: 'hello note' })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ text: 'hello note' })
    expect(typeof created.body.id).toBe('number')

    const fetched = await request(app).get(`/api/notes/${created.body.id}`)
    expect(fetched.status).toBe(200)
    expect(fetched.body).toEqual(created.body)
  })

  it('GET /api/notes/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/notes/999999')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Note not found' })
  })

  it('GET /increment stores session counter per client', async () => {
    const agent = request.agent(app)

    const first = await agent.get('/increment')
    expect(first.status).toBe(200)
    expect(first.body.counter).toBe(1)

    const second = await agent.get('/increment')
    expect(second.status).toBe(200)
    expect(second.body.counter).toBe(2)
  })

  it('GET /boom returns 500 from error middleware', async () => {
    const res = await request(app).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Something went wrong' })
  })

  it('guest cannot DELETE /posts/:id', async () => {
    const res = await request(app).delete('/posts/1')
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'Access denied' })
  })

  it('authenticated user can DELETE /posts/:id', async () => {
    const agent = request.agent(app)

    const login = await agent.get('/session/login')
    expect(login.status).toBe(302)
    expect(login.headers.location).toBe('/')

    const deleted = await agent.delete('/posts/1')
    expect(deleted.status).toBe(302)
    expect(deleted.headers.location).toBe('/')
  })

  it('POST /users sets flash message for next request only', async () => {
    const agent = request.agent(app)

    const create = await agent.post('/users')
    expect(create.status).toBe(302)
    expect(create.headers.location).toBe('/')

    const firstPage = await agent.get('/')
    expect(firstPage.status).toBe(200)
    expect(firstPage.text).toContain('Пользователь создан')

    const secondPage = await agent.get('/')
    expect(secondPage.status).toBe(200)
    expect(secondPage.text).not.toContain('Пользователь создан')
  })

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/unknown-route')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })
})
