@echo off
:: Generate qr.html with correct IP and port
:: Usage: generate-qr.bat [port]  (default port: 8081)

set PORT=8081
if not "%~1"=="" set PORT=%~1

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set IP=%%a
    set IP=%IP: =%
    goto :found
)
:found

:: Write qr.html
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<meta charset="utf-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Al-Quran — Scan QR Code^</title^>
echo     ^<style^>
echo         body {
echo             margin: 0;
echo             min-height: 100vh;
echo             display: flex;
echo             flex-direction: column;
echo             align-items: center;
echo             justify-content: center;
echo             background: linear-gradient(135deg, #0d9488, #0f766e^);
echo             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
echo             color: white;
echo             padding: 20px;
echo         }
echo         h1 { font-size: 28px; margin: 0 0 8px; }
echo         p { font-size: 16px; opacity: 0.9; margin: 4px 0; text-align: center; }
echo         .qr-container {
echo             background: white;
echo             padding: 24px;
echo             border-radius: 20px;
echo             margin: 24px 0;
echo             box-shadow: 0 20px 60px rgba(0,0,0,0.3^);
echo         }
echo         img { display: block; width: 300px; height: 300px; }
echo         .steps {
echo             background: rgba(255,255,255,0.1^);
echo             border-radius: 16px;
echo             padding: 20px 28px;
echo             margin-top: 16px;
echo             max-width: 500px;
echo         }
echo         .steps ol { padding-left: 20px; line-height: 2; font-size: 15px; }
echo         .url {
echo             background: rgba(0,0,0,0.2^);
echo             padding: 8px 16px;
echo             border-radius: 8px;
echo             font-family: monospace;
echo             font-size: 14px;
echo             margin-top: 12px;
echo             word-break: break-all;
echo         }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Al-Qur'an App^</h1^>
echo     ^<p^>Scan this QR code with Expo Go^</p^>
echo     ^<div class="qr-container"^>
echo         ^<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=exp://%IP%:%PORT%" alt="QR Code" /^>
echo     ^</div^>
echo     ^<div class="steps"^>
echo         ^<ol^>
echo             ^<li^>Install ^<b^>Expo Go^</b^> from App Store (iPhone^) or Google Play (Android^)^</li^>
echo             ^<li^>Make sure your phone is on the ^<b^>same WiFi^</b^> as this computer^</li^>
echo             ^<li^>Open Expo Go and ^<b^>scan this QR code^</b^>^</li^>
echo         ^</ol^>
echo         ^<div class="url"^>exp://%IP%:%PORT%^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > qr.html

echo QR code generated: exp://%IP%:%PORT%
echo Open qr.html in your browser
