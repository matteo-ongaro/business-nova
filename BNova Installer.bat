@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Business Nova + Ollama - preparazione
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js non e' installato. Installalo da https://nodejs.org/ e poi riapri questo file.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm non e' disponibile. Reinstalla Node.js da https://nodejs.org/ e riprova.
  pause
  exit /b 1
)

echo Installo gli strumenti necessari per creare l'app Windows...
call npm install --save-dev electron electron-builder
if errorlevel 1 goto :error

echo.
echo Creo l'installer di Business Nova...
call npm run desktop:dist
if errorlevel 1 goto :error

if not exist "release" mkdir "release"
echo.
echo Scarico l'installer ufficiale di Ollama...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile 'release\OllamaSetup.exe' -UseBasicParsing; if ((Get-Item 'release\OllamaSetup.exe').Length -lt 1000000) { throw 'Il file scaricato sembra incompleto.' } } catch { Write-Error $_; exit 1 }"
if errorlevel 1 (
  echo Non sono riuscito a scaricare Ollama automaticamente.
  echo Puoi scaricarlo dal sito ufficiale: https://ollama.com/download/windows
  start "" "https://ollama.com/download/windows"
)

echo.
echo Operazione completata. Gli installer sono nella cartella release.
echo Avvia Business Nova-Setup-0.1.0.exe e OllamaSetup.exe per installarli.
explorer "%~dp0release"
pause
exit /b 0

:error
echo.
echo Si e' verificato un errore. Controlla la connessione e riprova.
pause
exit /b 1
