require('dotenv').config() // Load environment variables

// Try to connect to MongoDB but don't block server startup
try {
  require('./db')
  console.log("MongoDB connection initiated...")
} catch (err) {
  console.warn("⚠️  MongoDB not available (motor control still works):", err.message)
}

const Reading = require('./models/reading')
const express = require('express')
const cors = require('cors')
// Use native fetch (Node 18+) - no need for node-fetch

const app = express()
app.use(cors())
app.use(express.json())

// 🔐 ENVIRONMENT CONFIG
const PORT = process.env.PORT || 3000
const ESP32_IP = process.env.ESP32_IP || "http://192.168.0.101"
const API_TOKEN = process.env.API_TOKEN || "dev-token-change-in-production"

// 🔑 AUTH MIDDLEWARE: Check API token on sensitive endpoints
const requireAuth = (req, res, next) => {
  const token = req.headers['x-api-token'] || req.query.token
  if (token !== API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API token' })
  }
  next()
}

// 🔥 GLOBAL STATE
let motorState = false

function normalizeMotor(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const upper = value.toUpperCase()
    return upper === 'ON' || upper === 'TRUE' || upper === '1'
  }
  return false
}

// Basic response for browser checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'smart-tank-backend' })
})

// 🔹 CURRENT STATUS (for frontend)
app.get('/api/current', async (req, res) => {
  try {
    const espRes = await fetch(`${ESP32_IP}/data`)
    if (!espRes.ok) {
      throw new Error(`ESP32 /data failed: ${espRes.status}`)
    }

    const data = await espRes.json()
    motorState = normalizeMotor(data.motor)

    res.json({
      ...data,
      motor: motorState,
      level: Number(data.level) || 0
    })
  } catch (err) {
    console.log('ESP32 data error:', err.message)
    res.status(502).json({
      error: 'ESP32 unreachable',
      message: err.message,
      motor: motorState,
      level: 0
    })
  }
})

// 🔹 HISTORY (still works with DB)
app.get('/api/history', async (req, res) => {
  try {
    const data = await Reading.find().sort({ time: -1 }).limit(50)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history', message: err.message })
  }
})

// 🔹 ANALYTICS (simplified)
app.get('/api/analytics', async (req, res) => {
  try {
    const records = await Reading.find()

    const timesMotorOn = records.filter(r => r.motor === "ON").length

    res.json({
      avgLevel: 0,
      maxLevel: 0,
      minLevel: 0,
      timesMotorOn,
      motorRunning: motorState
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics', message: err.message })
  }
})

// 🔥 MAIN: MOTOR CONTROL (MOST IMPORTANT) - REQUIRES AUTH
app.post('/api/motor/:state', requireAuth, async (req, res) => {
  const state = req.params.state
  const shouldTurnOn = state === 'on'

  // ✅ update local state
  motorState = shouldTurnOn

  console.log("Motor:", shouldTurnOn ? "ON" : "OFF")

  // Try to save to DB, but don't fail motor control if it errors
  const record = {
    level: 0,
    motor: shouldTurnOn ? "ON" : "OFF",
    time: new Date()
  }

  try {
    await Reading.create(record)
  } catch (dbErr) {
    console.warn("DB save error (motor control still works):", dbErr.message)
  }

  try {
    // 🔥 CONTROL ESP32
    await fetch(`${ESP32_IP}/control?state=${state}`)

    res.json({
      success: true,
      motor: motorState
    })

  } catch (err) {
    console.log("ESP32 error:", err.message)

    res.json({
      success: false,
      motor: motorState,
      message: "ESP32 not reachable"
    })
  }
})

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))