@echo off
title Iniciando Bot de Restaurante - OpenWA
echo ==================================================
echo      INICIANDO SISTEMA DE WHATSAPP BOT
echo ==================================================
echo.

:: Verificar si Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor, instala Node.js antes de continuar.
    echo Puedes descargarlo desde: https://nodejs.org/
    pause
    exit
)

echo [+] Iniciando API y Dashboard...
echo [i] Por favor, no cierres esta ventana mientras uses el bot.
echo.

:: Truco: Esperar 10 segundos en segundo plano y abrir el navegador
:: Esto da tiempo a que los servidores levanten antes de abrir la web
start /b cmd /c "timeout /t 10 /nobreak >nul && start http://localhost:2886"

:: Ejecutar el comando que inicia tanto el backend como el dashboard
npm run dev
