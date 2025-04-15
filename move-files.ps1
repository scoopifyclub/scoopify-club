Write-Host "Moving files..."
Copy-Item -Path "scoopify-club\*" -Destination "." -Recurse -Force
Remove-Item -Path "scoopify-club" -Recurse -Force
Write-Host "Files moved successfully!"
pause 