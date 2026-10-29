@echo off
chcp 65001 >nul
title Aethelgard Shopping Mall - Khoi Chay Docker Container
color 0B

pushd "%~dp0"

echo ===============================================================================
echo          AETHELGARD SHOPPING MALL - DOCKER CONTAINER DEPLOYMENT
echo ===============================================================================
echo.

:: 1. Kiem tra Docker Daemon
echo [*] Kiem tra ket noi Docker Engine...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] CANH BAO: Docker Engine chua duoc khoi dong hoac chua bat Docker Desktop!
    echo [*] Vui long mo ung dung Docker Desktop tren may tinh roi chay lai file nay.
    echo.
    pause
    popd
    exit /b 1
)

echo [v] Docker Engine da san sang!
echo.

:: 2. Build va Khoi chay Docker Compose (Tu dong build va khoi chay moi nhat)
echo [*] Dang dong goi va khoi chay cac Container qua Docker Compose...
docker compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo [!] Co loi xay ra trong qua trinh build hoac chay Docker Compose.
    pause
    popd
    exit /b 1
)

echo.
echo ===============================================================================
echo   DOCKER CONTAINERS DA KHOI CHAY THANH CONG!
echo   - Frontend Portal: http://localhost:3001
echo   - Backend Web API: http://localhost:5000 (Swagger: http://localhost:5000/swagger)
echo   - CSDL SQLite:     Luu tru ben vung tai volume 'sqlite_data'
echo ===============================================================================
echo.
echo [*] Dang khoi tao ung dung trong 3 giay...
ping 127.0.0.1 -n 4 >nul
start "" http://localhost:3001

echo.
echo De dung he thong Docker, hay chay script: docker-stop.cmd
echo Nhan phim bat ky de dong cua so nay (he thong van tiep tuc chay trong Docker).
pause >nul
popd
