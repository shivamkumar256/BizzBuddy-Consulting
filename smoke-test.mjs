import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-smoke-'))
const dataDir = path.join(tmp, 'data')
const uploadDir = path.join(tmp, 'uploads')
const port = 8791
const origin = 'http://localhost:5173'

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(port),
  FRONTEND_URL: origin,
  DATA_DIR: dataDir,
  UPLOAD_DIR: uploadDir,
  ADMIN_EMAIL: 'smoke@example.com',
  ADMIN_PASSWORD: 'smoke-test-password-123',
  SESSION_SECRET: 'smoke-secret-'.padEnd(40, 'x'),
}

const child = spawn(process.execPath, [SERVER], { env, stdio: ['ignore', 'pipe', 'pipe'] })
child.stdout.on('data', () => {})
child.stderr.on('data', (d) => process.stderr.write('[server] ' + d))

const base = `http://127.0.0.1:${port}`
let failures = 0
const assert = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}: ${msg}`); if (!cond) failures++ }

async function waitReady() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`${base}/api/health`); if (r.ok) return } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('server did not become ready')
}

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')


try {
  await waitReady()
  const health = await fetch(`${base}/api/health`).then((r) => r.json())
  assert(health.status === 'ok', 'GET /api/health returns ok')

  const pub0 = await fetch(`${base}/api/public/items`).then((r) => r.json())
  assert(Array.isArray(pub0) && pub0.length === 0, 'public items empty at start')

  const noAuth = await fetch(`${base}/api/admin/items`)
  assert(noAuth.status === 401, 'admin items requires auth (401)')

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: 'smoke@example.com', password: 'smoke-test-password-123' }),
  })
  const setCookie = login.headers.get('set-cookie') || ''
  const cookie = setCookie.split(';')[0]
  assert(login.status === 200 && cookie.startsWith('bb_session='), 'admin login sets signed session cookie')
  assert(login.headers.get('access-control-allow-origin') === origin, 'CORS echoes allowed origin')

  const bad = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke@example.com', password: 'wrong' }),
  })
  assert(bad.status === 401, 'wrong password rejected (401)')

  // Credential normalization: mixed-case email and stray surrounding whitespace
  // (common when values are pasted into a host dashboard) must still succeed.
  const normalized = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: '  SMOKE@Example.com  ', password: '  smoke-test-password-123  ' }),
  })
  assert(normalized.status === 200, 'login tolerates email case + surrounding whitespace')


  const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie, Origin: origin } }).then((r) => r.json())
  assert(me.email === 'smoke@example.com', 'GET /api/auth/me returns logged-in email')

  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), 'test.png')
  const up = await fetch(`${base}/api/admin/uploads`, { method: 'POST', headers: { Cookie: cookie, Origin: origin }, body: form })
  const upBody = await up.json()
  assert(up.status === 200 && /^\/api\/media\//.test(upBody.url), `upload returns media url (${upBody.url})`)

  const create = await fetch(`${base}/api/admin/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: origin },
    body: JSON.stringify({ type: 'post', title: 'Smoke Project', description: 'desc', thumbnail_url: upBody.url, media_url: upBody.url, status: 'published', featured: true }),
  })
  const created = await create.json()
  assert(create.status === 201 && created.id, 'create published item (201)')

  const pub1 = await fetch(`${base}/api/public/items`).then((r) => r.json())
  assert(pub1.length === 1 && pub1[0].status === 'published', 'public items shows published item')

  const media = await fetch(`${base}${upBody.url}`)
  const mediaType = media.headers.get('content-type') || '(none)'
  console.log(`   media content-type: ${mediaType}, status: ${media.status}, bytes: ${(await media.clone().arrayBuffer()).byteLength}`)
  assert(media.status === 200, 'published media served via /api/media (200)')

  const unpub = await fetch(`${base}/api/admin/items/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: origin },
    body: JSON.stringify({ type: 'post', title: 'Smoke Project', description: 'desc', thumbnail_url: upBody.url, media_url: upBody.url, status: 'draft', featured: false }),
  })
  assert(unpub.status === 200, 'unpublish item (200)')
  const pub2 = await fetch(`${base}/api/public/items`).then((r) => r.json())
  assert(pub2.length === 0, 'public items empty after unpublish')
  const media2 = await fetch(`${base}${upBody.url}`)
  assert(media2.status === 404, 'media returns 404 once unreferenced')

  assert(fs.existsSync(path.join(dataDir, 'portfolio.db')), 'SQLite db created under DATA_DIR')
  assert(fs.readdirSync(uploadDir).length >= 1, 'uploaded file stored under UPLOAD_DIR')
  assert(/Secure/i.test(setCookie) && /SameSite=None/i.test(setCookie), 'session cookie is Secure; SameSite=None in production')
} catch (error) {
  console.log('ERROR:', error.message)
  failures++
} finally {
  child.kill()
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch {}
}

console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${failures} SMOKE TEST(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
