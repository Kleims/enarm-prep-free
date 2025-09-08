@echo off
echo Starting ENARM Prep Local Server...
echo.
echo Open your browser and go to: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8080
pause