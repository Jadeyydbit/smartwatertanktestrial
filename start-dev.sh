#!/bin/bash

# Start backend
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../water-level-frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Backend running (PID: $BACKEND_PID)"
echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo "🌐 Frontend URL: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
