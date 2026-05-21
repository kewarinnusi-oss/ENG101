@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Please install Node.js LTS from https://nodejs.org/
  echo Then close VS Code, open it again, and run this file.
  pause
  exit /b 1
)

node server.mjs
pause
