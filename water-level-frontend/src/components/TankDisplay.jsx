function TankDisplay({ level = 0, levelLabel = 'Normal', statusTone = 'safe' }) {
  const clampedLevel = Math.max(0, Math.min(100, level))

  return (
    <article className="panel tank-panel">
      <h2>Main Tank</h2>
      <div className="tank-wrap" aria-label="Tank water level">
        <div className="tank-wave" style={{ height: `${clampedLevel}%` }} />
      </div>
      <div className="kpi-row">
        <span className="kpi-value">{clampedLevel}%</span>
        <span className={`kpi-tag ${statusTone}`}>{levelLabel}</span>
      </div>
      <p className="tank-note">Safe operation: 40% - 85%</p>
    </article>
  )
}

export default TankDisplay
