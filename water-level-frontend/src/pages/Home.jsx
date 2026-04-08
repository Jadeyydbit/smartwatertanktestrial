import { Link } from 'react-router-dom'

function Home() {
  const components = [
    { label: 'Microcontroller', value: 'ESP32-WROOM-32' },
    { label: 'Sensor Type', value: 'HC-SR04 Ultrasonic' },
    { label: 'Control', value: 'Relay Module 5V' },
    { label: 'Connectivity', value: '802.11 WiFi' },
  ]

  const objectives = [
    {
      title: 'Continuous Water Measurement',
      description: 'Continuously measure water level using non-contact ultrasonic sensing',
      icon: '💧',
    },
    {
      title: 'Automatic Motor Control',
      description: 'Automatically control motor pump based on water level thresholds',
      icon: '⚙️',
    },
    {
      title: 'Dry-Run Protection',
      description: 'Protect motor from dry-run damage with automatic detection',
      icon: '🛡️',
    },
    {
      title: 'Manual Override',
      description: 'Provide physical and remote manual override capability',
      icon: '🕹️',
    },
    {
      title: 'Event Logging',
      description: 'Log all motor events with timestamps for diagnostic purposes',
      icon: '📝',
    },
    {
      title: 'Reliable Operation',
      description: 'Operate reliably 24x7 and survive power cuts automatically',
      icon: '⚡',
    },
  ]

  return (
    <main className="home-page">
      <section className="hero-section-centered">
        <h1 className="hero-title">SMART WATER TANK</h1>
        <p className="hero-subtitle">Monitoring & Control System</p>
        <p className="hero-description">
          An IoT hardware system designed to automate monitoring and control of domestic or commercial water tanks using ESP32 microcontroller, ultrasonic sensor, and relay module.
        </p>
        <div className="hero-actions-centered">
          <Link className="cta primary" to="/dashboard">
            Open Dashboard
          </Link>
          <Link className="cta ghost" to="/reports">
            View Reports
          </Link>
        </div>
      </section>

      <section className="wqi-section">
        <h2>System Stack</h2>
        <div className="wqi-grid">
          {components.map((comp) => (
            <div key={comp.label} className="wqi-card">
              <p className="wqi-label">{comp.label}</p>
              <p className="wqi-value" style={{ fontSize: '1.3rem' }}>{comp.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2>Project Objectives</h2>
        <p className="features-desc">
          Key goals of the Smart Water Tank Monitoring and Control System
        </p>
        <div className="objectives-grid">
          {objectives.map((objective) => (
            <article key={objective.title} className="objective-card">
              <span className="objective-icon">{objective.icon}</span>
              <h3>{objective.title}</h3>
              <p>{objective.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <p className="stat-value">24x7</p>
          <p className="stat-label">Continuous Operation</p>
        </div>
        <div className="stat-item">
          <p className="stat-value">0.3cm</p>
          <p className="stat-label">Sensor Resolution</p>
        </div>
        <div className="stat-item">
          <p className="stat-value">10A</p>
          <p className="stat-label">Relay Capacity</p>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Deploy Your Smart Water Tank System?</h2>
        <p>Install the hardware and connect to the monitoring dashboard for complete tank automation.</p>
      </section>
    </main>
  )
}

export default Home
