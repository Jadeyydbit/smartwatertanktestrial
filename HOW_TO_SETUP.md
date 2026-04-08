# Smart Water Tank Monitoring System - Setup Guide

This guide helps you set up and run the project on a new laptop.

## 1) Prerequisites

Install these first:

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- MongoDB Community Server (running locally)

Optional:

- MongoDB Compass (for viewing database records)

## 2) Clone and Open the Project

```bash
git clone <your-repo-url>
cd Smart-water-tank-monitoring-system---IOT
```

Open this folder in VS Code.

## 3) Install Dependencies

Run these commands from the project root:

```bash
npm install
cd backend
npm install
cd ..\water-level-frontend
npm install
cd ..
```

If you use macOS/Linux, use `/` instead of `\\` in paths.

## 4) Start MongoDB

Make sure MongoDB is running on:

```text
mongodb://127.0.0.1:27017
```

The app uses database:

```text
water_tank
```

## 5) Run the Backend API

In terminal 1:

```bash
cd backend
node server.js
```

Expected log:

- `MongoDB Connected`
- `Backend running on http://localhost:3000`

## 6) Run the Frontend

In terminal 2:

```bash
cd water-level-frontend
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## 7) Verify It Works

Quick checks:

- Frontend loads in browser.
- Backend endpoint works: `http://localhost:3000/api/current`
- Toggling motor from UI updates backend data/history.

## 8) Useful Commands

From root:

```bash
npm run dev
```

This runs only the frontend from root scripts.

Frontend commands:

```bash
cd water-level-frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## 9) Common Issues and Fixes

1. MongoDB connection error
   - Ensure MongoDB service is started.
   - Confirm port `27017` is available.

2. Port already in use
   - Backend uses `3000`, frontend uses `5173` by default.
   - Stop the conflicting process or change port.

3. API not reachable from frontend
   - Confirm backend is running at `http://localhost:3000`.
   - Check `water-level-frontend/src/services/api.js` uses:
     - `USE_BACKEND = true`
     - `BASE_URL = "http://localhost:3000/api"`

4. ESP32 not connected
   - This is expected for local simulation.
   - Backend returns simulation response if ESP32 is offline.

## 10) Team Workflow Suggestion

- Create your own branch before changes:

```bash
git checkout -b your-name/feature-name
```

- Commit small, clear changes.
- Open a pull request for review.

---

If setup still fails, share:

- The exact error message
- Which step failed
- Your OS and Node.js version (`node -v`)