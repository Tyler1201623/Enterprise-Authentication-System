@echo off
echo Starting Enterprise Authentication Login System...
echo.
echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo.
echo ----------------------------------------------
echo The application will open in your web browser.
echo If it doesn't open automatically, visit:
echo http://localhost:3000
echo ----------------------------------------------
echo.

call npm run dev:open

pause 