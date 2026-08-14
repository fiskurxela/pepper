@echo off
echo // PEPPER // @fiskurxela
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is required to run Pepper. Download it from https://nodejs.org
    echo Click any key to close this terminal.
    pause >nul
    exit
)
node pepper.js
echo.
echo Bye bye! (Press any key to exit.)
pause >nul