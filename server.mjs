import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 8787)
const required = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'SESSION_SECRET']
const missing = required.filter((key) => !process.env[key])
if (missing.length) throw new Error(`Missing required environment values: ${missing.join(', ')}. Copy .env.example to .env and set them.`)
if (process.env.ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.')

fs.mkdirSync(path.join(root, 'data'), { recursive: true })
fs.mkdirSync(path.join(root, 'private', 'storage', 'uploads'), { recursive: true })
const db = new Database(path.join(root, 'data', 'portfolio.db'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, thumbnail_url TEXT NOT NULL DEFAULT '', media_url TEXT NOT NULL DEFAULT '', client TEXT NOT NULL DEFAULT '', website_url TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', date TEXT NOT NULL DEFAULT '', featured INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
`)
const now = () => new Date().toISOString()
const configuredPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12)
const existingAdmin = db.prepare('SELECT id FROM users LIMIT 1').get()
if (!existingAdmin) db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), process.env.ADMIN_EMAIL, configuredPasswordHash, now())
else db.prepare('UPDATE users SET email = ?, password_hash = ? WHERE id = ?').run(process.env.ADMIN_EMAIL, configuredPasswordHash, existingAdmin.id)
db.prepare("DELETE FROM items WHERE client = 'Internal placeholder' AND (title LIKE 'Your %' OR tags = ?)").run(JSON.stringify(['Internal placeholder']))

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser(process.env.SESSION_SECRET))
const sessions = new Map()
const auth = (request, response, next) => { const token = request.signedCookies.bb_session; const session = token && sessions.get(token); if (!session || session.expires < Date.now()) return response.status(401).json({ error: 'Authentication required' }); request.user = session; next() }
const serialize = (item) => ({ ...item, featured: Boolean(item.featured), tags: JSON.parse(item.tags || '[]') })
const validTypes = new Set(['post', 'reel', 'website', 'branding', 'other'])
const validStatuses = new Set(['draft', 'published'])
const normalize = (body) => {
  if (!validTypes.has(body.type) || !validStatuses.has(body.status) || !String(body.title || '').trim()) throw new Error('Type, title, and status are required.')
  const websiteUrl = String(body.website_url || '').trim()
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) throw new Error('Website URL must begin with http:// or https://.')
  return { type: body.type, title: String(body.title).trim().slice(0, 200), description: String(body.description || '').slice(0, 2000), thumbnail_url: String(body.thumbnail_url || '').slice(0, 1000), media_url: String(body.media_url || '').slice(0, 1000), client: String(body.client || '').slice(0, 200), website_url: websiteUrl.slice(0, 1000), category: String(body.category || body.type).slice(0, 100), tags: JSON.stringify(Array.isArray(body.tags) ? body.tags.map(String).slice(0, 20) : []), date: String(body.date || '').slice(0, 30), featured: body.featured ? 1 : 0, status: body.status }
}
app.post('/api/auth/login', async (request, response) => { const { email, password } = request.body || {}; const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email); if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) return response.status(401).json({ error: 'Invalid email or password' }); const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId: user.id, email: user.email, expires: Date.now() + 8 * 60 * 60 * 1000 }); response.cookie('bb_session', token, { signed: true, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 }); response.json({ email: user.email }) })
app.post('/api/auth/logout', (request, response) => { const token = request.signedCookies.bb_session; if (token) sessions.delete(token); response.clearCookie('bb_session'); response.status(204).end() })
app.get('/api/auth/me', auth, (request, response) => response.json({ email: request.user.email }))
app.get('/api/public/items', (request, response) => response.json(db.prepare("SELECT * FROM items WHERE status = 'published' ORDER BY featured DESC, updated_at DESC").all().map(serialize)))
app.get('/api/admin/items', auth, (request, response) => response.json(db.prepare('SELECT * FROM items ORDER BY updated_at DESC').all().map(serialize)))
app.post('/api/admin/items', auth, (request, response) => { try { const value = normalize(request.body); const id = crypto.randomUUID(); const timestamp = now(); db.prepare('INSERT INTO items (id,type,title,description,thumbnail_url,media_url,client,website_url,category,tags,date,featured,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, ...Object.values(value), timestamp, timestamp); response.status(201).json(serialize(db.prepare('SELECT * FROM items WHERE id = ?').get(id))) } catch (error) { response.status(400).json({ error: error.message }) } })
app.put('/api/admin/items/:id', auth, (request, response) => { try { const value = normalize(request.body); const timestamp = now(); db.prepare('UPDATE items SET type=?,title=?,description=?,thumbnail_url=?,media_url=?,client=?,website_url=?,category=?,tags=?,date=?,featured=?,status=?,updated_at=? WHERE id=?').run(...Object.values(value), timestamp, request.params.id); const item = db.prepare('SELECT * FROM items WHERE id = ?').get(request.params.id); if (!item) return response.status(404).json({ error: 'Item not found' }); response.json(serialize(item)) } catch (error) { response.status(400).json({ error: error.message }) } })
app.delete('/api/admin/items/:id', auth, (request, response) => { const result = db.prepare('DELETE FROM items WHERE id = ?').run(request.params.id); if (!result.changes) return response.status(404).json({ error: 'Item not found' }); response.status(204).end() })
const upload = multer({ dest: path.join(root, 'private', 'storage', 'uploads'), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (request, file, callback) => callback(null, /^(image\/(jpeg|png|webp|gif)|video\/mp4|video\/webm)$/.test(file.mimetype)) })
app.post('/api/admin/uploads', auth, upload.single('file'), (request, response) => { if (!request.file) return response.status(400).json({ error: 'Upload an image, MP4, WebM, PNG, JPEG, WebP, or GIF.' }); response.json({ url: `/api/media/${request.file.filename}`, filename: request.file.originalname, mimetype: request.file.mimetype }) })
app.get('/api/media/:filename', (request, response) => {
  const url = `/api/media/${path.basename(request.params.filename)}`
  const referenced = db.prepare("SELECT id FROM items WHERE status = 'published' AND (thumbnail_url = ? OR media_url = ?) LIMIT 1").get(url, url)
  if (!referenced) return response.status(404).end()
  response.sendFile(path.join(root, 'private', 'storage', 'uploads', path.basename(request.params.filename)))
})

const dist = path.join(root, 'dist')
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.use((request, response) => response.sendFile(path.join(dist, 'index.html'))) }
app.listen(port, () => console.log(`BizzBuddy server listening on http://localhost:${port}`))
