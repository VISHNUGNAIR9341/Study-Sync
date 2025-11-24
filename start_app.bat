@echo off
echo Starting Smart Student Planner...

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo All services started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
