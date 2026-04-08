# Smart Water Tank Monitoring System - Project Overview

## 1) Project Purpose

This project is an IoT-based water tank monitoring and motor control system.

It provides:

- Live tank level simulation/monitoring
- Manual motor ON/OFF control from a web dashboard
- Event history saved to MongoDB
- Analytics and runtime insights in a reports page

The system is designed so teams can run it locally even without ESP32 hardware.

## 2) High-Level Architecture

The solution has 3 major layers:

1. Frontend (React + Vite)
2. Backend API (Node.js + Express)
3. Database (MongoDB)

### Flow

1. Frontend calls backend REST APIs every 5 seconds for live values.
2. Backend simulates current water level in memory.
3. Motor toggle actions are saved as event records in MongoDB.
4. Reports page reads event history + analytics from backend endpoints.
5. Backend optionally attempts to call ESP32 endpoints; if unavailable, it continues in simulation mode.

## 3) Main Technologies

- React 19
- React Router
- Vite
- Node.js + Express
- MongoDB + Mongoose

## 4) Frontend Structure and Responsibilities

### App Shell and Routing

- The app uses React Router and defines three main routes:
  - `/` -> Home
  - `/dashboard` -> Live operations and motor control
  - `/reports` -> Historical/analytic insights

### Pages

1. Home
   - Project introduction and hardware stack summary
   - CTA links to Dashboard and Reports

2. Dashboard
   - Polls current level and motor status every 5 seconds
   - Shows current percentage, average recent level, and status label
   - Allows manual motor toggle through backend API
   - Displays recent UI-side event messages

3. Reports
   - Polls reports/analytics every 5 seconds
   - Shows average/max/min level, motor ON count, runtime stats
   - Renders recent level trend chart (SVG)
   - Displays runtime session log and detailed records table

### Reusable Components

1. TankDisplay
   - Visual tank fill using current level
   - Shows status tag (Low/Medium/High)

2. MotorControl
   - Shows motor status (Running/Stopped)
   - Provides ON/OFF action button

### Frontend API Service Layer

The service module centralizes calls to backend endpoints:

- `getLatestWaterLevel()`
- `getMotorStatus()`
- `toggleMotorAPI(turnOn)`
- `getReports()`
- `getAnalytics()`

It supports backend mode and fallback/simulation behavior.

## 5) Backend Structure and Responsibilities

### Server Responsibilities

The backend maintains runtime state and exposes APIs.

In-memory runtime state includes:

- `currentLevel` (0-100)
- `motorState` (ON/OFF)
- active runtime session start time
- recent in-memory runtime sessions

### Simulation Loop

Every 5 seconds:

- If motor is ON, level increases
- If motor is OFF, level decreases
- Value is clamped to 0-100

This allows full testing without physical hardware.

### Persistence Rule

Database writes occur on motor toggle events.

When `/api/motor/:state` is called:

1. Motor state is updated.
2. A record is created in MongoDB (`level`, `motor`, `time`).
3. Backend tries forwarding command to ESP32.
4. If ESP32 is unreachable, backend returns simulation-friendly response.

## 6) Database Model

Collection model: `Reading`

Fields:

- `level` (Number)
- `motor` (String: `ON` or `OFF`)
- `time` (Date)

Database connection:

- Local MongoDB
- Database name: `water_tank`

## 7) API Endpoints

Base URL: `http://localhost:3000/api`

1. `GET /current`
   - Returns current simulated level and motor state.

2. `GET /history`
   - Returns last 50 saved `Reading` records.

3. `GET /analytics`
   - Computes average, min, max levels
   - Counts motor ON events
   - Computes current/last/total motor runtime
   - Returns recent runtime log sessions

4. `POST /motor/on` or `POST /motor/off`
   - Changes motor state
   - Persists an event record
   - Attempts ESP32 relay trigger

## 8) Runtime and Analytics Logic Notes

- Live water level is simulated in memory.
- History and reports are based on MongoDB event records.
- Runtime sessions are derived from ON -> OFF event pairs.
- If no DB records exist, analytics return safe default values.

## 9) Hardware Integration Behavior

The backend is configured with ESP32 endpoint URL.

- If ESP32 is online, motor command is forwarded.
- If ESP32 is offline, system still works in simulation mode.

This is useful for development, demos, and team onboarding without hardware dependency.

## 10) Typical User Journey

1. Open Dashboard.
2. Monitor live tank level.
3. Toggle motor ON/OFF manually.
4. Open Reports for usage trends and runtime logs.
5. Inspect detailed event table for historical behavior.

## 11) Current Limitations

- Level data is simulated unless real sensor API is wired in.
- Authentication/authorization is not implemented.
- No environment variable based configuration yet.
- Root npm scripts run frontend only; backend starts separately.

## 12) Suggested Next Improvements

1. Add `.env` support for ports, DB URL, and ESP32 URL.
2. Add a backend `npm run dev` script using nodemon.
3. Add validation and centralized error handling on APIs.
4. Add authentication for motor control actions.
5. Add tests for API routes and analytics calculations.
