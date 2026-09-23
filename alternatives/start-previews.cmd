@echo off
title Quiz hand-off previews (5501-5503)
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py serve.py --open) else (python serve.py --open)
pause
