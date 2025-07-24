@echo off
REM AI Travel Concierge Platform - Windows Setup & Run Script
REM This script sets up and starts both backend and frontend on Windows

REM === Detect Python ===
set PYTHON_CMD=
where python >nul 2>nul && set PYTHON_CMD=python
if "%PYTHON_CMD%"=="" where py >nul 2>nul && set PYTHON_CMD=py
if "%PYTHON_CMD%"=="" where python3 >nul 2>nul && set PYTHON_CMD=python3
if "%PYTHON_CMD%"=="" (
    echo.
    echo [ERROR] Python 3.8+ is not installed or not in PATH.
    echo Please install Python from https://python.org/downloads/ and add to PATH.
    pause
    exit /b 1
)

REM === Check Node.js ===
where node >nul 2>nul || (
    echo.
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/ and add to PATH.
    pause
    exit /b 1
)

REM === Setup Backend ===
echo.
echo [SETUP] Setting up backend...
cd backend
if not exist venv (
    %PYTHON_CMD% -m venv venv
)
call venv\Scripts\activate
pip install --upgrade pip
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    pip install fastapi uvicorn requests python-dotenv pydantic
)
cd ..

echo [SETUP] Backend ready!

REM === Setup Frontend ===
echo.
echo [SETUP] Setting up frontend...
cd frontend
if not exist node_modules (
    npm install
)
cd ..

echo [SETUP] Frontend ready!

REM === Start Backend ===
echo.
echo [START] Starting backend server on http://localhost:8000 ...
start "Backend" cmd /k "cd /d %cd%\backend && call venv\Scripts\activate && python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000"

REM === Start Frontend ===
echo [START] Starting frontend server on http://localhost:3007 ...
start "Frontend" cmd /k "cd /d %cd%\frontend && npm run dev"

echo.
echo [INFO] Servers are starting. Access your platform at:
echo   Frontend: http://localhost:3007
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo [INFO] To stop servers, close the command windows.
echo [INFO] If you see errors, check that all dependencies are installed and ports are free.
pause 