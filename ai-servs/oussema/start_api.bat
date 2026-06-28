@echo off
echo Starting PeakWell Symptom AI (FastAPI)...
cd /d "%~dp0"
set PATH=C:\Users\omarg\anaconda3;C:\Users\omarg\anaconda3\Scripts;%PATH%
set PYTHONPATH=C:\Users\omarg\anaconda3\Lib\site-packages
C:\Users\omarg\anaconda3\python.exe -m uvicorn api:app --host 0.0.0.0 --port 8002
