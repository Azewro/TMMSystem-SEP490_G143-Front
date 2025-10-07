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

if (!fs.existsSync(indexPath)) {
  console.error('[Startup] dist/index.html not found at', indexPath)
} else {
  console.log('[Startup] Serving dist from', distPath)
}
app.use(express.static(distPath))

// SPA fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[Error] sendFile index.html failed:', err)
      res.status(500).send('Internal Server Error')
    }
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})


