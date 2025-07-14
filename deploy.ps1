# Magen Dvorim Adom - Deployment Script (PowerShell)
# This script builds and deploys the application to Firebase hosting

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Magen Dvorim Adom - Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "[1/2] Building production version..." -ForegroundColor Yellow
    Write-Host ""
    
    # Run npm build
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "[2/2] Deploying to Firebase..." -ForegroundColor Yellow
    Write-Host ""
    
    # Run firebase deploy (deploys hosting, storage, firestore, etc.)
    & firebase deploy
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed with exit code $LASTEXITCODE"
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Deployment completed successfully!" -ForegroundColor Green
    Write-Host " Your website is now live." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Pause to show results
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
