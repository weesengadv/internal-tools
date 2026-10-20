@echo off
title Weeseng Office - read-only diagnostics
echo This checks office setup status. It does not install or stop anything.
echo.
echo COMPUTER AND ADDRESS
hostname
ipconfig | findstr /i "IPv4"
echo.
echo OFFICE SERVICES
schtasks /query /tn "Weeseng Production Tools Office" /fo LIST
schtasks /query /tn "Weeseng Production Tools Update Receiver" /fo LIST
echo.
echo LISTENING PORTS
netstat -ano | findstr ":4174 :4175"
echo.
echo RECENT SETUP LOG
powershell.exe -NoProfile -Command "if(Test-Path -LiteralPath 'C:\WeesengProductionTools\logs\setup.log'){Get-Content -LiteralPath 'C:\WeesengProductionTools\logs\setup.log' -Tail 30}else{Write-Output 'No setup log found. Setup may not have started as administrator.'}"
echo.
echo Take a screenshot of this window for troubleshooting.
pause
