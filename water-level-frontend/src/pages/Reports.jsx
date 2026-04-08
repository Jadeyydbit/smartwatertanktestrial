import { useEffect, useState } from 'react'
import { getReports, getAnalytics, getTrends } from '../services/api'
import './Reports.css'

function Reports() {
  const [rows, setRows] = useState([])
  const [analytics, setAnalytics] = useState({
    avgLevel: 0,
    maxLevel: 0,
    minLevel: 0,
    timesMotorOn: 0,
    motorRuntime: 0,
    motorRunning: false,
    runtimeLog: [],
    avgFillTime: 0,
  })
  const [levelTrends, setLevelTrends] = useState([])

  useEffect(() => {
    async function loadReports() {
      const data = await getReports()
      setRows(data)

      const stats = await getAnalytics()
      setAnalytics({
        ...stats,
        avgFillTime: 18
      })

      const trends = data
        .slice(-10)
        .map((item) => Number(item.level))
        .filter((value) => Number.isFinite(value))

      if (trends.length > 0) {
        setLevelTrends(trends)
      } else {
        setLevelTrends(getTrends())
      }
    }

    loadReports()

    const interval = setInterval(() => {
      loadReports()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const motorStats = {
    onDays: analytics.timesMotorOn,
    offDays: Math.max(0, rows.length - analytics.timesMotorOn)
  }

  const offSectionRuntime = analytics.motorRunning
    ? analytics.motorRuntimeCurrent
    : analytics.motorRuntime

  function formatRuntime(seconds) {
    if (!seconds || !Number.isFinite(Number(seconds))) {
      return '0 sec'
    }

    const totalSeconds = Math.max(0, Math.floor(Number(seconds)))
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60

    if (mins === 0) {
      return `${secs} sec`
    }

    return `${mins} min ${secs} sec`
  }

  function formatTimestamp(value) {
    if (!value) return '--'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '--'

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Generate SVG chart for level trends
  const renderTrendChart = () => {
    if (levelTrends.length === 0) {
      return <p className="no-data">No trend data available</p>
    }

    const maxValue = Math.max(...levelTrends, 100)
    const minValue = Math.min(...levelTrends, 0)
    const range = maxValue - minValue || 100
    const chartWidth = 500
    const chartHeight = 250
    const padding = 40

    const points = levelTrends.map((value, index) => {
      const x = padding + (index / (levelTrends.length - 1 || 1)) * (chartWidth - 2 * padding)
      const y = chartHeight - padding - ((value - minValue) / range) * (chartHeight - 2 * padding)
      return { x, y, value }
    })

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaData = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="trend-chart">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1={padding}
            y1={padding + (i / 4) * (chartHeight - 2 * padding)}
            x2={chartWidth - padding}
            y2={padding + (i / 4) * (chartHeight - 2 * padding)}
            stroke="#e5e7eb"
            strokeDasharray="5,5"
          />
        ))}

        {/* Area under curve */}
        <path d={areaData} fill="url(#areaGradient)" />

        {/* Line */}
        <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={`point-${i}`} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
        ))}

        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#9ca3af" strokeWidth="1" />
        {/* X-axis */}
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#9ca3af" strokeWidth="1" />

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => (
          <text
            key={`label-${i}`}
            x={padding - 10}
            y={padding + (i / 4) * (chartHeight - 2 * padding) + 4}
            textAnchor="end"
            fontSize="12"
            fill="#6b7280"
          >
            {Math.round(maxValue - (i / 4) * range)}
          </text>
        ))}
      </svg>
    )
  }

  return (
    <main className="reports-page">
      <section className="dashboard-heading">
        <h1>📊 Smart Tank Analysis Dashboard</h1>
        <p>Real-time water level trends and comprehensive tank monitoring analytics</p>
      </section>

      <section className="analytics-stats">
        <article className="stat-card primary-card">
          <div className="stat-icon">📈</div>
          <p>Average Level</p>
          <strong>{analytics.avgLevel}%</strong>
        </article>

        <article className="stat-card">
          <div className="stat-icon">⬆️</div>
          <p>Max Level</p>
          <strong>{analytics.maxLevel}%</strong>
        </article>

        <article className="stat-card">
          <div className="stat-icon">⬇️</div>
          <p>Min Level</p>
          <strong>{analytics.minLevel}%</strong>
        </article>

        <article className="stat-card">
          <div className="stat-icon">⚙️</div>
          <p>Motor ON Count</p>
          <strong>{analytics.timesMotorOn}</strong>
        </article>

        <article className="stat-card">
          <p>Motor Runtime</p>
          <strong>{formatRuntime(analytics.motorRuntime)}</strong>
          <small className={`runtime-status ${analytics.motorRunning ? 'running' : 'stopped'}`}>
            {analytics.motorRunning ? 'Running now' : 'Stopped'}
          </small>
        </article>
      </section>

      <section className="charts-grid">
        <article className="panel trend-panel">
          <div className="panel-header">
            <h3>📉 Recent Level Trend</h3>
            <span className="trend-info">{levelTrends.length} readings</span>
          </div>
          <div className="chart-container">
            {renderTrendChart()}
          </div>
        </article>

        <article className="panel motor-panel">
          <div className="panel-header">
            <h3>⚡ Motor Usage Statistics</h3>
          </div>

          <div className="runtime-visual-wrap">
            <div className="runtime-ring" style={{ '--runtime-progress': `${Math.min((analytics.motorRuntime / 120) * 100, 100)}%` }}>
              <div className="runtime-ring-inner">
                <p>Current Run</p>
                <strong>{formatRuntime(analytics.motorRuntime)}</strong>
              </div>
            </div>

            <div className="runtime-log">
              <h4>Recent Runtime Log</h4>
              {analytics.runtimeLog?.length > 0 ? (
                <ul>
                  {analytics.runtimeLog.map((entry, index) => (
                    <li key={`${entry.startedAt}-${index}`}>
                      <span>{formatTimestamp(entry.startedAt)} - {formatTimestamp(entry.endedAt)}</span>
                      <strong>{formatRuntime(entry.durationSeconds)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-log">No completed runtime sessions yet.</p>
              )}
            </div>
          </div>

          <div className="motor-stats-container">
            <div className="motor-stat on">
              <div className="motor-stat-value">{motorStats.onDays}</div>
              <div className="motor-stat-label">Times ON</div>
            </div>
            <div className="stat-divider"></div>
            <div className="motor-stat off">
              <div className="motor-stat-value runtime-value">{formatRuntime(offSectionRuntime)}</div>
              <div className="motor-stat-label">Last ON Runtime</div>
              <div className="motor-stat-meta">OFF events: {motorStats.offDays}</div>
            </div>
          </div>
          <div className="motor-ratio">
            <div className="ratio-bar">
              <div 
                className="ratio-fill"
                style={{ 
                  width: `${motorStats.onDays + motorStats.offDays > 0 ? (motorStats.onDays / (motorStats.onDays + motorStats.offDays) * 100) : 0}%`
                }}
              ></div>
            </div>
            <p className="ratio-text">Motor utilization ratio</p>
          </div>
        </article>
      </section>

      <section className="panel table-panel">
        <div className="panel-header">
          <h2>📋 Detailed Reports</h2>
          <span className="record-count">{rows.length} records</span>
        </div>

        {rows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Level</th>
                <th>Motor</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`row-${row.motor?.toLowerCase()}`}>
                  <td className="date-cell">{row.date}</td>
                  <td className="level-cell">
                    <div className="level-badge">{row.level}%</div>
                  </td>
                  <td className="motor-cell">
                    <span className={`motor-badge ${row.motor?.toLowerCase() || 'unknown'}`}>
                      {row.motor || 'N/A'}
                    </span>
                  </td>
                  <td className="note-cell">{row.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data-message">
            <p>No reports data available yet</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default Reports