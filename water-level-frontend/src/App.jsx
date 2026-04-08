import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="site-shell">
        <header className="site-header">
          <NavLink className="brand-link" to="/">
            AquaSense
          </NavLink>
          <nav className="site-nav" aria-label="Primary">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App