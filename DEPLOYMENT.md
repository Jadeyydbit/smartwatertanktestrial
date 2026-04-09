# 🚀 Cloud Deployment Guide: Complete Setup

This guide walks you through deploying your Smart Water Tank Monitoring System to the cloud for remote motor control from anywhere.

---

## 📋 Architecture Overview

```
Your Device (Laptop/Phone) 
    ↓ (HTTPS)
Frontend (Vercel) 
    ↓ (HTTPS)
Backend (Render) 
    ↓ (Local Network)
ESP32/Motor (at Tank Location)
```

**Key Points:**
- Frontend sends API token in headers
- Backend validates token before allowing motor control
- Backend connects to ESP32 on local network
- All internet traffic is encrypted (HTTPS)
- No USB cable needed after initial setup

---

## 🔧 STEP 1: Prepare Local Development

### 1.1 Install dotenv in backend
```bash
cd backend
npm install dotenv
```

### 1.2 Check .env files exist
```bash
# Backend
ls backend/.env          # Should exist with dev values
ls backend/.env.example  # Template

# Frontend  
ls water-level-frontend/.env.local      # Should exist with dev values
ls water-level-frontend/.env.example    # Template
```

### 1.3 Start locally to test
```bash
# Terminal 1: Backend
cd backend
npm install
npm start
# Should print: Backend running on http://localhost:3000

# Terminal 2: Frontend  
cd water-level-frontend
npm install
npm run dev
# Should print: Local running at http://localhost:5173
```

### 1.4 Test motor control locally
1. Open http://localhost:5173 in browser
2. Click motor toggle
3. Should see success/failure in console
4. Check backend logs for "Motor: ON" or "Motor: OFF"

---

## 🌐 STEP 2: Set Up Cloud Backend (Render.com Free Tier)

### 2.1 Create Render account
1. Go to https://render.com
2. Sign up with GitHub / Email
3. Verify email

### 2.2 Create MongoDB Atlas (free database)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Create a new project (name: "tank-monitoring")
4. Create a cluster (free tier is fine)
5. Create a database admin user
6. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
7. **Save this** - you'll need it for backend

### 2.3 Deploy backend to Render
1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/smart-tank-app
git push -u origin main
```

2. Go to https://render.com/dashboard
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name:** `smart-tank-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build:** `npm install`
   - **Start:** `npm start`
6. Add Environment Variables (click "Add Environment Variable"):
   - `MONGODB_URI` = Your MongoDB connection string from step 2.2
   - `ESP32_IP` = `http://YOUR_LOCAL_TANK_IP:80` (for now, or update later)
   - `API_TOKEN` = Generate strong token: `openssl rand -hex 32` (copy output)
   - `PORT` = (leave empty, Render sets automatically)

7. Click "Create Web Service" - takes ~2 minutes to deploy
8. Copy the backend URL (looks like: `https://smart-tank-backend.onrender.com`)
9. **Save this** - you'll need it for frontend

### 2.4 Test backend deployment
```bash
# Replace with your actual backend URL and token
curl -X GET https://smart-tank-backend.onrender.com/api/analytics \
  -H "x-api-token: YOUR_API_TOKEN_HERE"

# Should see JSON response with analytics
```

---

## 📱 STEP 3: Deploy Frontend (Vercel Free Tier)

### 3.1 Import project to Vercel
1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click "Import Project"
4. Select your GitHub repo
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `water-level-frontend`

### 3.2 Add Environment Variables
1. Go to Settings → Environment Variables
2. Add these:
   - `VITE_BACKEND_URL` = Your backend URL from step 2.3 (e.g., `https://smart-tank-backend.onrender.com`)
   - `VITE_API_TOKEN` = Same token you set in backend

3. Click Deploy

### 3.3 Visit deployed frontend
- After ~1 min, Vercel shows your frontend URL
- Example: `https://smart-tank-app.vercel.app`
- **Save this** - share with others to control your tank remotely

---

## 🔐 STEP 4: Secure ESP32 Access

Your backend needs to reach ESP32. You have two options:

### Option A: If ESP32 is on public internet (NOT recommended)
1. Make ESP32 accessible via public IP
2. Update backend `ESP32_IP` in Render environment variables
3. Not secure - anyone who finds your IP can control it

### Option B: ZeroTier VPN (Recommended for security)
This creates a private secure tunnel so backend can reach ESP32 from cloud.

1. Install ZeroTier on PC with ESP32:
   - Download from https://www.zerotier.com/
   - Install and join network (you create one free)

2. Install on Raspberry Pi / PC at tank location with backend:
   - Same process
   - Join same ZeroTier network

3. Backend can now use ZeroTier IP (looks like: `192.168.196.XX`)
4. Update backend `ESP32_IP` to ZeroTier IP in Render dashboard

### Option C: Ngrok Tunnel (Easy temporary solution)
```bash
# On PC where backend runs locally
ngrok http 3000
# Gives public URL like: ngrok.io/xxxx
```

---

## 🧪 STEP 5: End-to-End Test

1. **Open your deployed frontend:**
   ```
   https://smart-tank-app.vercel.app
   ```

2. **Click motor toggle**
   - Should see "Sending..." or success message

3. **Check logs:**
   - Render dashboard → smart-tank-backend → Logs
   - Should show: `Motor: ON` or `Motor: OFF`

4. **Verify motor physically**
   - If connected properly, relay should click on/off
   - Listen for pump/motor sound

5. **Test from different network**
   - Use phone on 4G (not home Wi-Fi)
   - Control motor from anywhere
   - ✅ You've got remote control!

---

## 💾 STEP 6: Production Hardening

### 6.1 Strong API Token
```bash
# Generate using OpenSSL
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1
```

### 6.2 Set in all places:
- **Render:** `API_TOKEN` env var
- **Vercel:** `VITE_API_TOKEN` env var
- **Backend code:** Uses `process.env.API_TOKEN`
- **Frontend code:** Uses `import.meta.env.VITE_API_TOKEN`

### 6.3 Database Security
- MongoDB: Enable IP allowlist in Atlas
  - Add only Render IP (check Render dashboard for outbound IP)
  - Add your home IP temporarily for local testing

### 6.4 Add Rate Limiting (Optional)
In backend `server.js`:
```javascript
const rateLimit = require('express-rate-limit')

const motorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // Max 10 motor commands per minute
})

app.post('/api/motor/:state', motorLimiter, requireAuth, async (req, res) => {
  // ... existing code
})
```

Then: `npm install express-rate-limit` in backend

---

## 🛑 STEP 7: Auto-Off Safety Feature (Important!)

Add this to backend `server.js`:

```javascript
// 15-minute auto-off failsafe
let motorTimeout = null

function autoOffMotor() {
  if (motorTimeout) clearTimeout(motorTimeout)
  
  motorTimeout = setTimeout(async () => {
    if (motorState) {
      console.log("⚠️  AUTO-OFF triggered after 15 minutes")
      motorState = false
      await Reading.create({
        motor: "OFF",
        level: 0,
        time: new Date(),
        note: "Auto-off safety"
      })
    }
  }, 15 * 60 * 1000)
}

// Call autoOffMotor() after motor turns ON in /api/motor endpoint
```

---

## 📊 Monitoring

### Check Render Logs
https://dashboard.render.com → smart-tank-backend → Logs

### Check Vercel Logs  
https://vercel.com → smart-tank-app → Deployments → Logs

### Manual Status Check
```bash
curl https://smart-tank-backend.onrender.com/api/analytics \
  -H "x-api-token: YOUR_TOKEN"

# Should return:
# {
#   "avgLevel": 0,
#   "maxLevel": 0,
#   "minLevel": 0,
#   "timesMotorOn": 5,
#   "motorRunning": false
# }
```

---

## 🚨 Troubleshooting

### Motor command fails with "401 Unauthorized"
- **Cause:** API token mismatch
- **Fix:** Verify `VITE_API_TOKEN` in Vercel = `API_TOKEN` in Render

### Backend can't reach ESP32
- **Cause:** ESP32 IP changed or backend IP is wrong
- **Fix:** 
  - Check ESP32 actual IP in terminal: `ping YOUR_TANK_IP`
  - Update Render `ESP32_IP` env var
  - Restart Render service

### Frontend not updating after motor toggle
- **Cause:** Cache or state not syncing
- **Fix:** Hard refresh (Ctrl+Shift+R), check console for errors

### MongoDB connection error
- **Cause:** Connection string wrong or IP not allowlisted
- **Fix:**
  - Check MongoDB connection string in Render
  - Verify Render IP is in MongoDB IP allowlist
  - Connection string should include database name and auth

---

## 📞 Quick Reference Commands

```bash
# Local development
cd backend && npm start
cd water-level-frontend && npm run dev

# Build frontend for Vercel  
cd water-level-frontend && npm run build

# Generate API token
openssl rand -hex 32

# Test backend
curl http://localhost:3000/api/analytics -H "x-api-token: dev-test-token-12345"

# Test motor
curl -X POST http://localhost:3000/api/motor/on \
  -H "x-api-token: dev-test-token-12345" \
  -H "Content-Type: application/json"
```

---

## ✅ Success Checklist

- [ ] Backend deployed to Render with environment variables
- [ ] Frontend deployed to Vercel with environment variables  
- [ ] MongoDB Atlas cluster created and connected
- [ ] API token set in both Render and Vercel
- [ ] Frontend successfully calls backend API
- [ ] Motor control works from deployed frontend
- [ ] ESP32 can be reached from backend (directly or via VPN)
- [ ] Auto-off safety timeout implemented
- [ ] Security: Strong API token generated
- [ ] Monitoring: Can view logs on Render and Vercel

Once all checkboxes are done, you have a **fully functional remote motor control system** with no USB dependency! 🎉

