#!/bin/bash
echo "Starting Storyfy Application..."

# Start backend
cd Storyfy
python app.py &

# Wait a moment for backend to initialize
sleep 3

# Start frontend
cd ../storyfy-frontend
npm run dev &

echo "Storyfy is running!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"

# Keep the script running
wait 