// 🌐 CLOUD BACKEND CONFIG
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "dev-token-change-in-production"

// 📡 Legacy ESP32 direct connection (fallback)
const BASE_URL = import.meta.env.VITE_ESP32_BASE_URL || "/esp32"
const DATA_URL = `${BASE_URL}/data`
const DEVICE_CACHE_TTL_MS = 700
const ESP32_FETCH_TIMEOUT_MS = 2500

let deviceDataCache = null
let lastDeviceFetchAt = 0
let inFlightDeviceFetch = null
let consecutiveFetchFailures = 0
let nextFetchRetryAt = 0

async function fetchDeviceData({ force = false } = {}) {
  const now = Date.now()

  if (!force && deviceDataCache && now - lastDeviceFetchAt < DEVICE_CACHE_TTL_MS) {
    return deviceDataCache
  }

  if (!force && now < nextFetchRetryAt) {
    if (deviceDataCache) return deviceDataCache
    throw new Error('ESP32 temporarily unreachable, retrying soon')
  }

  if (!force && inFlightDeviceFetch) {
    return inFlightDeviceFetch
  }

  inFlightDeviceFetch = (async () => {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), ESP32_FETCH_TIMEOUT_MS)

    try {
      // 🌐 Call backend API instead of ESP32 directly
      const res = await fetch(`${BACKEND_URL}/api/current`, {
        signal: controller.signal,
        headers: {
          "x-api-token": API_TOKEN
        }
      })
      if (!res.ok) {
        throw new Error(`Backend request failed: ${res.status}`)
      }

      const data = await res.json()
      deviceDataCache = data
      lastDeviceFetchAt = Date.now()
      consecutiveFetchFailures = 0
      nextFetchRetryAt = 0
      return data
    } catch (err) {
      consecutiveFetchFailures += 1
      const backoffMs = Math.min(30000, 2000 * (2 ** (consecutiveFetchFailures - 1)))
      nextFetchRetryAt = Date.now() + backoffMs
      throw err
    } finally {
      clearTimeout(timeoutHandle)
    }
  })()

  try {
    return await inFlightDeviceFetch
  } finally {
    inFlightDeviceFetch = null
  }
}

function normalizeMotor(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const upper = value.toUpperCase()
    return upper === 'ON' || upper === 'TRUE'
  }
  return false
}

export async function getLatestWaterLevel() {
  try {
    const data = await fetchDeviceData()
    return { level: data.level || 0 }
  } catch (err) {
    console.error("Error fetching level:", err)
    return { level: 0 }
  }
}

export async function getMotorStatus() {
  try {
    const data = await fetchDeviceData()
    return { isOn: normalizeMotor(data.motor) }
  } catch (err) {
    console.error("Error fetching motor:", err)
    return { isOn: false }
  }
}

export async function getSystemState() {
  try {
    const data = await fetchDeviceData()
    return {
      level: Number(data.level) || 0,
      motorOn: normalizeMotor(data.motor)
    }
  } catch (err) {
    console.error("Error fetching system state:", err)
    return {
      level: 0,
      motorOn: false
    }
  }
}

export async function toggleMotorAPI(turnOn) {
  try {
    // 🌐 Cloud backend API call
    const res = await fetch(`${BACKEND_URL}/api/motor/${turnOn ? "on" : "off"}`, {
      method: "POST",
      headers: {
        "x-api-token": API_TOKEN,
        "Content-Type": "application/json"
      }
    })

    const responseText = await res.text()
    let data = {}

    if (responseText) {
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { message: responseText }
      }
    }

    if (!res.ok || data.success === false) {
      throw new Error("Motor control failed")
    }

    await fetchDeviceData({ force: true })
    return data
  } catch (err) {
    console.error("Motor control error:", err)
    throw err
  }
}

export async function getReports() {
  try {
    const data = await fetchDeviceData()
    const events = Array.isArray(data.log) ? data.log : []

    return events.map((item, index) => {
      const message = String(item)
      const timeText = message.includes(' - ') ? message.split(' - ')[0] : data.time || '--:--'
      const note = message.includes(' - ') ? message.split(' - ').slice(1).join(' - ') : message

      return {
        id: `${timeText}-${index}`,
        date: timeText,
        level: Number(data.level) || 0,
        motor: note.toUpperCase().includes('MOTOR ON') ? 'ON' : note.toUpperCase().includes('MOTOR OFF') ? 'OFF' : normalizeMotor(data.motor) ? 'ON' : 'OFF',
        note
      }
    })
  } catch (err) {
    console.error("Reports error:", err)
    return []
  }
}

export async function getAnalytics() {
  try {
    const data = await fetchDeviceData()

    const levels = Array.isArray(data.hl)
      ? data.hl.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : []

    const runtimeLog = []
    const logs = Array.isArray(data.log) ? data.log : []
    let activeStart = null

    for (const entry of logs) {
      const text = String(entry)
      const parts = text.split(' - ')
      const timestamp = parts.length > 1 ? parts[0] : null
      const message = parts.length > 1 ? parts.slice(1).join(' - ') : text

      if (!timestamp) continue

      const state = message.toUpperCase()
      const currentTime = new Date()
      const [hours, minutes, seconds] = timestamp.split(':').map((value) => Number(value))
      if ([hours, minutes, seconds].some((value) => Number.isNaN(value))) continue
      currentTime.setHours(hours, minutes, seconds, 0)

      if (state.includes('MOTOR ON')) {
        activeStart = currentTime
      }

      if (state.includes('MOTOR OFF') && activeStart) {
        const durationSeconds = Math.max(0, Math.round((currentTime.getTime() - activeStart.getTime()) / 1000))
        runtimeLog.push({
          startedAt: activeStart.toISOString(),
          endedAt: currentTime.toISOString(),
          durationSeconds
        })
        activeStart = null
      }
    }

    const timesMotorOn = logs.filter((entry) => String(entry).toUpperCase().includes('MOTOR ON')).length
    const currentRuntime = Number(data.motor) && activeStart
      ? Math.max(0, Math.round((Date.now() - activeStart.getTime()) / 1000))
      : 0
    const lastCompletedRuntime = runtimeLog.length ? runtimeLog[runtimeLog.length - 1].durationSeconds : 0
    const motorRuntime = Number(data.motor) ? currentRuntime : lastCompletedRuntime

    return {
      avgLevel: levels.length ? Math.round(levels.reduce((sum, value) => sum + value, 0) / levels.length) : Number(data.level) || 0,
      maxLevel: levels.length ? Math.max(...levels) : Number(data.level) || 0,
      minLevel: levels.length ? Math.min(...levels) : Number(data.level) || 0,
      timesMotorOn,
      motorRuntime,
      motorRuntimeCurrent: currentRuntime,
      motorRuntimeTotal: runtimeLog.reduce((sum, item) => sum + item.durationSeconds, 0) + currentRuntime,
      motorRunning: normalizeMotor(data.motor),
      runtimeLog
    }
  } catch (err) {
    console.error("Analytics error:", err)
    return {
      avgLevel: 0,
      maxLevel: 0,
      minLevel: 0,
      timesMotorOn: 0,
      motorRuntime: 0,
      motorRuntimeCurrent: 0,
      motorRuntimeTotal: 0,
      motorRunning: false,
      runtimeLog: []
    }
  }
}

export function getTrends() {
  return [15, 22, 28, 35, 42, 48, 54, 61, 68, 72]
}