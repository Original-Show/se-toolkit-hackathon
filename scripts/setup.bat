@echo off
REM Setup script for Windows development environment.

echo === Recipe Manager - Setup Script ===

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is required but not installed.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Copy env file if not exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
)

echo.
echo Setup complete!
echo.
echo To start the backend server:
echo   cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo.
echo To start the frontend, open frontend/index.html in your browser.
echo.
echo Or use Docker:
echo   docker compose up --build
pause
