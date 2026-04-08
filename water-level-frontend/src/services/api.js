const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 🔹 SWITCHES
const USE_BACKEND = true   // ✅ turn ON for backend
const BASE_URL = "http://localhost:3000/api"

// 🔹 FALLBACK (old system)
const USE_REAL_API = false
const ESP32_IP = "http://192.168.1.10"

// 🔹 LOCAL MEMORY (fallback only)
let historyStore = []

function normalizeMotor(value) {
if (typeof value === 'boolean') return value
if (typeof value === 'string') {
const upper = value.toUpperCase()
return upper === 'ON' || upper === 'TRUE'
}
return false
}

// 🔹 GET WATER LEVEL
export async function getLatestWaterLevel() {
if (USE_BACKEND) {
const res = await fetch(`${BASE_URL}/current`)
const data = await res.json()
return { level: data.level }
}

if (USE_REAL_API) {
const res = await fetch(`${ESP32_IP}/level`)
const data = await res.json()

saveToHistory(data.level, data.motor)
return { level: data.level }

}

await wait(150)

const level = Math.floor(Math.random() * 100)
const motor = Math.random() > 0.5

saveToHistory(level, motor)

return { level }
}

// 🔹 GET MOTOR STATUS
export async function getMotorStatus() {
if (USE_BACKEND) {
const res = await fetch(`${BASE_URL}/current`)
const data = await res.json()
return { isOn: normalizeMotor(data.motor) }
}

if (USE_REAL_API) {
const res = await fetch(`${ESP32_IP}/level`)
const data = await res.json()
return { isOn: normalizeMotor(data.motor) }
}

await wait(150)
return { isOn: Math.random() > 0.5 }
}

// 🔹 MOTOR CONTROL
export async function toggleMotorAPI(turnOn) {
if (USE_BACKEND) {
const res = await fetch(`${BASE_URL}/motor/${turnOn ? "on" : "off"}`, {
method: "POST"
})

if (!res.ok) {
throw new Error('Failed to toggle motor')
}

return res.json()
}

if (USE_REAL_API) {
await fetch(`${ESP32_IP}/motor/${turnOn ? "on" : "off"}`)
return { success: true }
}

await wait(100)
return { success: true }
}

// 🔹 SAVE DATA (fallback only)
function saveToHistory(level, motor) {
historyStore.push({
level,
motor: motor ? 'ON' : 'OFF',
time: new Date()
})

if (historyStore.length > 50) {
historyStore.shift()
}
}

// 🔹 GET REPORTS
export async function getReports() {
if (USE_BACKEND) {
const res = await fetch(`${BASE_URL}/history`)
const data = await res.json()

return data.map((item) => {
const levelValue = Number(item.level)
const safeLevel = Number.isFinite(levelValue) ? levelValue : 0
const motorValue = normalizeMotor(item.motor) ? 'ON' : 'OFF'

return {
id: item._id || item.id,
date: item.time,
level: safeLevel,
motor: motorValue,
note: safeLevel < 30 ? 'Low level' : safeLevel > 80 ? 'High level' : 'Normal'
}
})
}

await wait(100)

return historyStore.map((item, index) => ({
id: index,
date: item.time.toISOString().split('T')[0],
level: item.level,
motor: item.motor,
note: item.level < 30 ? 'Low level' : item.level > 80 ? 'High level' : 'Normal'
}))
}

// 🔹 GET ANALYTICS
export async function getAnalytics() {
if (USE_BACKEND) {
const res = await fetch(`${BASE_URL}/analytics`)
const data = await res.json()

return {
avgLevel: Number(data.avgLevel) || 0,
maxLevel: Number(data.maxLevel) || 0,
minLevel: Number(data.minLevel) || 0,
timesMotorOn: Number(data.timesMotorOn) || 0,
motorRuntime: Number(data.motorRuntime) || 0,
motorRuntimeCurrent: Number(data.motorRuntimeCurrent) || 0,
motorRuntimeTotal: Number(data.motorRuntimeTotal) || 0,
motorRunning: normalizeMotor(data.motorRunning),
runtimeLog: Array.isArray(data.runtimeLog) ? data.runtimeLog : []
}
}

if (!historyStore.length) {
return {
avgLevel: 0,
maxLevel: 0,
minLevel: 0,
timesMotorOn: 0
}
}

const levels = historyStore.map(i => i.level)

return {
avgLevel: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length),
maxLevel: Math.max(...levels),
minLevel: Math.min(...levels),
timesMotorOn: historyStore.filter(i => i.motor === 'ON').length
}
}

// 🔹 GET TRENDS
export function getTrends() {
return historyStore.slice(-10).map(i => i.level)
}
