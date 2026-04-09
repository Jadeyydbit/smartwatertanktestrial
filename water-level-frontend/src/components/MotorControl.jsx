function MotorControl({ isOn, onToggle }) {

  // 🔥 HANDLE CLICK (LOGIC ONLY)
  const handleToggle = async () => {
    try {
      await onToggle()
    } catch (err) {
      console.error("Motor toggle failed:", err)
      alert("Failed to control motor")
    }
  }

  return (
    <article className="panel control-panel">
      <h2>Motor Control</h2>
      <p className="muted-line">Current state</p>

      <p className={`motor-chip ${isOn ? 'on' : 'off'}`}>
        {isOn ? 'Running' : 'Stopped'}
      </p>

      <button
        className={`motor-btn ${isOn ? 'danger' : 'safe'}`}
        onClick={handleToggle}   // 🔥 changed here
      >
        Turn {isOn ? 'OFF' : 'ON'}
      </button>

      <p className="hint-text">Switch OFF when level is close to full.</p>
    </article>
  )
}

export default MotorControl