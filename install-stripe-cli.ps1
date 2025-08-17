# Stripe CLI Installation Script
Write-Host "Installing Stripe CLI..." -ForegroundColor Cyan

# Create directory in user profile (no admin rights needed)
$installDir = "$env:USERPROFILE\stripe-cli"
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force
}

# Download Stripe CLI
$url = "https://github.com/stripe/stripe-cli/releases/download/v1.19.1/stripe_1.19.1_windows_x86_64.zip"
$zipPath = "$installDir\stripe-cli.zip"
$exePath = "$installDir\stripe.exe"

Write-Host "Downloading Stripe CLI..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $url -OutFile $zipPath

# Extract the zip file
Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $installDir -Force

# Clean up zip file
Remove-Item $zipPath

# Add to PATH for current session
$env:PATH += ";$installDir"

# Test installation
Write-Host "Testing installation..." -ForegroundColor Yellow
try {
    & "$exePath" --version
    Write-Host "Stripe CLI installed successfully!" -ForegroundColor Green
    Write-Host "Path: $exePath" -ForegroundColor Cyan
    Write-Host "To use in new sessions, add this to your PATH: $installDir" -ForegroundColor Yellow
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
}
