import { useEffect, useMemo, useState } from 'react'
import { getLatestWaterLevel, getMotorStatus, toggleMotorAPI } from '../services/api'
import TankDisplay from '../components/TankDisplay'
import MotorControl from '../components/MotorControl'

function Dashboard() {
  const [level, setLevel] = useState(0)
  const [motorOn, setMotorOn] = useState(false)
  const [history, setHistory] = useState([])
  const [events, setEvents] = useState([])

  function generateTimestamp(minutesAgo = 0) {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutesAgo)
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  // INITIAL LOAD
  useEffect(() => {
    async function loadInitialState() {
      const [water, motor] = await Promise.all([
        getLatestWaterLevel(),
        getMotorStatus(),
      ])

      setLevel(water.level)
      setMotorOn(motor.isOn)
      setHistory([water.level])
    }

    loadInitialState()
  }, [])

  // LIVE POLLING
  useEffect(() => {
    const interval = setInterval(async () => {
      const [water, motor] = await Promise.all([
        getLatestWaterLevel(),
        getMotorStatus(),
      ])

      setLevel(water.level)
      setMotorOn(motor.isOn)

      setHistory((prev) => [
        ...prev.slice(-9),
        water.level
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const levelLabel = useMemo(() => {
    if (level < 30) return 'Low'
    if (level < 70) return 'Medium'
    return 'High'
  }, [level])

  const averageLevel = useMemo(() => {
    if (!history.length) return 0
    const total = history.reduce((sum, value) => sum + value, 0)
    return Math.round(total / history.length)
  }, [history])

  const statusTone = level < 30 ? 'danger' : level < 70 ? 'warn' : 'safe'

  async function toggleMotor() {
    const desiredState = !motorOn

    try {
      await toggleMotorAPI(desiredState)

      // Re-sync from backend to avoid UI state drift when requests are delayed.
      const [water, motor] = await Promise.all([
        getLatestWaterLevel(),
        getMotorStatus(),
      ])

      const event = motor.isOn ? 'Motor turned ON manually' : 'Motor turned OFF manually'

      setLevel(water.level)
      setMotorOn(motor.isOn)
      setEvents((old) => [`${generateTimestamp()} - ${event}`, ...old.slice(0, 4)])
    } catch {
      setEvents((old) => [`${generateTimestamp()} - Failed to change motor state`, ...old.slice(0, 4)])
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <h1>Operations Dashboard</h1>
        <p>Live tank status, motor control, and system health in one place.</p>
      </section>

      <section className="dashboard-overview">
        <article className="overview-card">
          <p>Current Level</p>
          <strong>{level}%</strong>
        </article>
        <article className="overview-card">
          <p>Motor Status</p>
          <strong>{motorOn ? 'Running' : 'Stopped'}</strong>
        </article>
        <article className="overview-card">
          <p>Average Level</p>
          <strong>{averageLevel}%</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <TankDisplay level={level} levelLabel={levelLabel} statusTone={statusTone} />
        <MotorControl isOn={motorOn} onToggle={toggleMotor} />

        <article className="panel events-panel">
          <h2>Recent Events</h2>
          <ul className="event-list">
            {events.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default Dashboard