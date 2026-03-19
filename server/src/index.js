import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import apiRouter from './routes/api.js'
import youtubeRouter from './routes/youtube.js'
import proposalRouter from './routes/proposal.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api', apiRouter)
app.use('/api/youtube', youtubeRouter)
app.use('/api/proposal', proposalRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
