@echo off
setlocal
echo Ask staff to save their work before this update.
pause
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0office\install.ps1" -Update
pause
endlocal
