@echo off
setlocal
echo Ask staff to save their work before restoring the previous release.
pause
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0office\install.ps1" -Rollback
pause
endlocal
