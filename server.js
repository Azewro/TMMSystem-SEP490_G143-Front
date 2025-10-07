import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 8080

const distPath = path.join(__dirname, 'dist')
const indexPath = path.join(distPath, 'index.html')
let indexHtml = ''

if (!fs.existsSync(indexPath)) {
  console.error('[Startup] dist/index.html not found at', indexPath)
} else {
  console.log('[Startup] Serving dist from', distPath)
  try {
    indexHtml = fs.readFileSync(indexPath, 'utf8')
    console.log('[Startup] index.html loaded in memory, length=', indexHtml.length)
  } catch (e) {
    console.error('[Startup] Failed to read index.html:', e)
  }
}
app.use(express.static(distPath))

// simple healthcheck & request log
app.get('/health', (req, res) => {
  res.status(200).send('ok')
})

app.use((req, _res, next) => {
  console.log('[Request]', req.method, req.url)
  next()
})

// Root handler
app.get('/', (_req, res) => {
  if (indexHtml) {
    res.set('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(indexHtml)
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[Error] sendFile / index.html failed:', err)
      res.status(500).send('Internal Server Error')
    }
  })
})

// SPA fallback to index.html
app.get('*', (req, res, next) => {
  // If the request looks like a static file (has an extension), skip to 404/static
  if (path.extname(req.path)) return next()
  if (indexHtml) {
    res.set('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(indexHtml)
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[Error] sendFile fallback index.html failed:', err)
      res.status(500).send('Internal Server Error')
    }
  })
})

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err)
  res.status(500).send('Internal Server Error')
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})


