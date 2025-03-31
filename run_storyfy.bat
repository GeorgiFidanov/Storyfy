@echo off
echo Starting Storyfy Application...

:: Start backend
start cmd /k "cd storyfy-backend && python app.py"

:: Wait a moment for backend to initialize
timeout /t 3

:: Start frontend
start cmd /k "cd storyfy-frontend && npm run dev"

echo Storyfy is running!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173 