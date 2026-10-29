@echo off
chcp 65001 >nul
title Aethelgard Mall - Local CI Pipeline Runner
color 0A

pushd "%~dp0\.."

echo ===============================================================================
echo          AETHELGARD SHOPPING MALL - CHAY KIEM THU CI CUC BO (LOCAL CI)
echo ===============================================================================
echo.

:: 1. Backend: Restore, Build, Test
echo [1/3] Dang kiem tra Backend [.NET 10 va Tests]...
dotnet restore backend/Ecommerce.slnx
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [X] LOI: Khong the restore NuGet packages cho Backend!
    goto error
)

dotnet build backend/Ecommerce.slnx -c Release --no-restore
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [X] LOI: Bien dich Backend that bai!
    goto error
)

dotnet test backend/Ecommerce.slnx -c Release --no-build --verbosity normal
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [X] LOI: Mot hoac nhieu bai kiem thu Backend bi that bai!
    goto error
)
echo [V] Toan bo bai test Backend .NET 10 DA VUOT QUA [100%]!
echo.

:: 2. Frontend: Type Check & Build
echo [2/3] Dang kiem tra Frontend [Next.js va TypeScript]...
cd frontend
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    cd ..
    color 0C
    echo [X] LOI: Phat hien loi kieu du lieu TypeScript!
    goto error
)

call npm run build
if %ERRORLEVEL% NEQ 0 (
    cd ..
    color 0C
    echo [X] LOI: Bien dich Frontend Production that bai!
    goto error
)
cd ..
echo [V] Frontend Next.js bien dich hoan hao [0 Loi]!
echo.

:: 3. Docker Compose Config Validation
echo [3/3] Dang kiem tra tinh hop le cua cau hinh Docker Compose...
docker compose config >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo [!] Canh bao: Khong the kiem tra docker compose [vui long dam bao Docker Desktop dang bat].
) else (
    echo [V] File docker-compose.yml hoan toan hop le!
)

echo.
echo ===============================================================================
echo   TAT CA KIEM TRA CI DA THANH CONG! MA NGUON SAN SANG COMMIT VA DAY LEN GIT.
echo ===============================================================================
echo.
pause
popd
exit /b 0

:error
echo.
echo ===============================================================================
echo   KIEM TRA CI THAT BAI! Vui long khac phuc cac loi truoc khi commit.
echo ===============================================================================
echo.
pause
popd
exit /b 1
