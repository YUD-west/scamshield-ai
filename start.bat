@echo off
setlocal enabledelayedexpansion
title ScamShield AI Launcher
cd /d "%~dp0"

echo ====================================================
echo Starting ScamShield AI [Backend + Frontend]
echo ====================================================

REM Check Backend on port 8000
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Backend API Server on Port 8000...
    if exist "%~dp0backend\.venv\Scripts\python.exe" (
        start "ScamShield Backend" /min cmd /c "cd /d \"%~dp0backend\" && set PYTHONPATH=%~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    ) else (
        start "ScamShield Backend" /min cmd /c "cd /d \"%~dp0backend\" && set PYTHONPATH=%~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    )
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] Backend is already running on port 8000.
)

REM Check Frontend on port 5173
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Frontend UI on Port 5173...
    start "ScamShield Frontend" /min cmd /c "cd /d \"%~dp0frontend\" && npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo [2/3] Frontend is already running on port 5173.
)

REM Open in Default Browser
echo [3/3] Opening ScamShield AI in your browser...
start http://localhost:5173

echo ====================================================
echo ScamShield AI is LIVE at http://localhost:5173
echo ====================================================
timeout /t 4 /nobreak >nul
exit
