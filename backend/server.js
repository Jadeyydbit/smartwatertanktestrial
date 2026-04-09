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

// 🔹 CURRENT STATUS (for frontend)
app.get('/api/current', (req, res) => {
  res.json({
    motor: motorState,
    level: 0 // dummy since no sensor
  })
})

// 🔹 HISTORY (still works with DB)
app.get('/api/history', async (req, res) => {
  const data = await Reading.find().sort({ time: -1 }).limit(50)
  res.json(data)
})

// 🔹 ANALYTICS (simplified)
app.get('/api/analytics', async (req, res) => {
  const records = await Reading.find()

  const timesMotorOn = records.filter(r => r.motor === "ON").length

  res.json({
    avgLevel: 0,
    maxLevel: 0,
    minLevel: 0,
    timesMotorOn,
    motorRunning: motorState
  })
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