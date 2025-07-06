@echo off
echo ========================================
echo  Magen Dvorim Adom - Deployment Script
echo ========================================
echo.

echo [1/2] Building production version...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying to Firebase hosting...
echo.
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment completed successfully!
echo  Your website is now live.
echo ========================================
echo.
pause
