require('./db')
const Reading = require('./models/reading')
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
app.use(cors())
app.use(express.json())

const ESP32_IP = "http://192.168.1.10"

// 🔥 GLOBAL STATE
let currentLevel = 0
let motorState = false

let history = []
let motorStartedAt = null
let runtimeSessions = []

function setMotorState(nextState) {
const now = Date.now()

if (nextState && !motorState) {
motorStartedAt = now
}

if (!nextState && motorState && motorStartedAt !== null) {
const durationSeconds = (now - motorStartedAt) / 1000

runtimeSessions.push({
  startedAt: new Date(motorStartedAt).toISOString(),
  endedAt: new Date(now).toISOString(),
  durationSeconds: Math.round(durationSeconds)
})

if (runtimeSessions.length > 30) {
  runtimeSessions = runtimeSessions.slice(-30)
}

motorStartedAt = null

}

motorState = nextState
}

function getCurrentMotorRuntimeSeconds() {
if (motorState && motorStartedAt !== null) {
return (Date.now() - motorStartedAt) / 1000
}
return 0
}

// 🔥 REALISTIC TANK SIMULATION (NO DB SAVE HERE)
async function fetchData() {

if (motorState) {
currentLevel += 2   // filling
} else {
currentLevel -= 0.3 // usage
}

if (currentLevel > 100) currentLevel = 100
if (currentLevel < 0) currentLevel = 0

console.log("Level:", Math.round(currentLevel), "| Motor:", motorState ? "ON" : "OFF")
}

// 🔹 RUN EVERY 5 SEC
setInterval(fetchData, 5000)

// 🔹 CURRENT DATA
app.get('/api/current', (req, res) => {
res.json({
level: Math.round(currentLevel),
motor: motorState
})
})

// 🔹 HISTORY FROM DATABASE
app.get('/api/history', async (req, res) => {
const data = await Reading.find().sort({ time: -1 }).limit(50)
res.json(data)
})

// 🔹 ANALYTICS
app.get('/api/analytics', async (req, res) => {
const records = await Reading.find().sort({ time: 1 }).limit(500)

if (!records.length) {
return res.json({
avgLevel: 0,
maxLevel: 0,
minLevel: 0,
timesMotorOn: 0,
motorRuntime: Math.round(getCurrentMotorRuntimeSeconds()),
motorRuntimeCurrent: Math.round(getCurrentMotorRuntimeSeconds()),
motorRuntimeTotal: 0,
motorRunning: motorState,
runtimeLog: runtimeSessions.slice(-8).reverse()
})
}

const levels = records
.map((item) => Number(item.level))
.filter((value) => Number.isFinite(value))

const avg = levels.length
? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)
: 0

const timesMotorOn = records.filter((item) => String(item.motor).toUpperCase() === 'ON').length

let activeStart = null
const dbSessions = []

for (const item of records) {
const state = String(item.motor).toUpperCase()
const itemTime = new Date(item.time)

if (Number.isNaN(itemTime.getTime())) {
continue
}

if (state === 'ON' && activeStart === null) {
activeStart = itemTime
continue
}

if (state === 'OFF' && activeStart !== null) {
const durationSeconds = Math.max(0, Math.round((itemTime.getTime() - activeStart.getTime()) / 1000))

dbSessions.push({
startedAt: activeStart.toISOString(),
endedAt: itemTime.toISOString(),
durationSeconds
})

activeStart = null
}
}

const currentRuntime = Math.round(getCurrentMotorRuntimeSeconds())
const lastCompletedRuntime = dbSessions.length ? dbSessions[dbSessions.length - 1].durationSeconds : 0
const totalCompletedRuntime = dbSessions.reduce((sum, item) => sum + item.durationSeconds, 0)
const totalRuntime = totalCompletedRuntime + currentRuntime

res.json({
avgLevel: avg,
maxLevel: levels.length ? Math.max(...levels) : 0,
minLevel: levels.length ? Math.min(...levels) : 0,
timesMotorOn,
motorRuntime: motorState ? currentRuntime : lastCompletedRuntime,
motorRuntimeCurrent: currentRuntime,
motorRuntimeTotal: totalRuntime,
motorRunning: motorState,
runtimeLog: dbSessions.slice(-8).reverse()
})
})

// 🔥 MOTOR CONTROL (ONLY PLACE WE SAVE DATA)
app.post('/api/motor/:state', async (req, res) => {
const state = req.params.state
const shouldTurnOn = state === 'on'

setMotorState(shouldTurnOn)

const record = {
level: Math.round(currentLevel),
motor: shouldTurnOn ? "ON" : "OFF",
time: new Date()
}

// 🔥 SAVE ONLY HERE
await Reading.create(record)

history.push(record)
if (history.length > 100) history.shift()

console.log("Event Saved:", record)

try {
await fetch(`${ESP32_IP}/motor/${state}`)
res.json({
success: true,
motor: motorState,
level: Math.round(currentLevel)
})
} catch {
res.json({
success: false,
motor: motorState,
level: Math.round(currentLevel),
message: "ESP32 not connected (simulation mode)"
})
}
})

app.listen(3000, () => console.log("Backend running on http://localhost:3000"))
