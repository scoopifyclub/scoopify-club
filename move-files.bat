@echo off
echo Moving files...
xcopy /E /I scoopify-club\* .
rmdir /S /Q scoopify-club
echo Files moved successfully!
pause 