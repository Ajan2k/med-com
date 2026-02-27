@echo off
cd /d d:\Desktop\med-com
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force -ErrorAction SilentlyContinue"
start /min uvicorn backend.app:app --host 127.0.0.1 --port 8000
exit
