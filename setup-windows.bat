@echo off
:: ============================================================
::  SmartSales AI — Windows Setup Fix
::  Run this as Administrator (right-click → Run as administrator)
:: ============================================================

echo.
echo  SmartSales AI — Windows Setup
echo  ===============================
echo.

:: The error happens because Windows + antivirus + GitHub folder
:: blocks composer writing zip files to deeply nested paths.
:: This script moves the project to C:\smartsales and sets it up.

SET TARGET=C:\smartsales

echo [1/6] Checking if project is already at %TARGET% ...
IF EXIST "%TARGET%\backend\composer.json" (
    echo     Already at %TARGET% - skipping copy.
) ELSE (
    echo [1/6] Copying project to %TARGET% ...
    IF NOT EXIST "%TARGET%" mkdir "%TARGET%"
    xcopy /E /I /Q "%~dp0." "%TARGET%"
    echo     Done. Project copied to %TARGET%
)

echo.
echo [2/6] Setting full permissions on %TARGET% ...
icacls "%TARGET%" /grant "%USERNAME%":(OI)(CI)F /T /Q
echo     Done.

echo.
echo [3/6] Disabling composer cache (avoids temp file permission issues) ...
SET COMPOSER_CACHE_DIR=NUL
SET COMPOSER_NO_INTERACTION=1

echo.
echo [4/6] Running composer install in %TARGET%\backend ...
cd /d "%TARGET%\backend"
composer install --no-interaction --prefer-dist --optimize-autoloader
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: composer install failed.
    echo  Try running this script as Administrator.
    echo  Or open a terminal in %TARGET%\backend and run:
    echo     composer install --prefer-dist
    pause
    exit /b 1
)

echo.
echo [5/6] Setting up Laravel environment ...
IF NOT EXIST ".env" (
    copy .env.example .env
    php artisan key:generate
    php artisan jwt:secret
)
php artisan migrate --seed

echo.
echo [6/6] Done!
echo.
echo  =====================================================
echo   Project is ready at: %TARGET%
echo  =====================================================
echo.
echo  Open VS Code at: %TARGET%
echo  Then run these 3 commands in separate terminal tabs:
echo.
echo   Tab 1:  cd backend  ^&^&  php artisan serve
echo   Tab 2:  cd backend  ^&^&  php artisan queue:work --queue=ai,default
echo   Tab 3:  cd frontend ^&^&  npm install ^&^& ng serve
echo.
echo  Login at http://localhost:4200
echo    Email:    admin@smartsales.dev
echo    Password: Password1
echo.
pause
