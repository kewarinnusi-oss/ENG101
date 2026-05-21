$node = Get-Command node -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host "Node.js is not installed or not available in PATH." -ForegroundColor Red
  Write-Host "Install Node.js LTS from https://nodejs.org/"
  Write-Host "Then close VS Code, open it again, and run: .\start-windows.ps1"
  exit 1
}

node server.mjs
