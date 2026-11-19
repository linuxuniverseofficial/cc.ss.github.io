@echo off
rem Coastal Chaos - servidor ONLINE local (jogo + api.php) com o PHP embutido.
rem Precisa do PHP no PATH (https://windows.php.net/download) com pdo_sqlite e mbstring ligados no php.ini.
cd /d "%~dp0"
set PORT=%1
if "%PORT%"=="" set PORT=8080
if not exist online\data mkdir online\data
echo Servidor ONLINE em http://localhost:%PORT%/  (feche esta janela para parar)
php -S 0.0.0.0:%PORT% -t .
