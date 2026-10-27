@echo off
chcp 65001 >nul
title Aethelgard Shopping Mall - Dung Docker Container
color 0C

pushd "%~dp0"

echo ===============================================================================
echo          AETHELGARD SHOPPING MALL - DUNG DOCKER CONTAINER
echo ===============================================================================
echo.
echo [*] Dang dung va go bo cac container...
docker compose down

echo.
echo [v] Da dung toan bo container Aethelgard Mall thanh cong!
echo Du lieu CSDL SQLite van duoc bao toan ben vung trong volume 'sqlite_data'.
echo.
pause
popd
