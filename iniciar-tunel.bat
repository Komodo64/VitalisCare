@echo off
title Vitalis Care - Tunel Publico para Celulares (HTTPS)
color 0A
echo ======================================================================
echo       VITALIS CARE - TUNEL PUBLICO PARA ACCESO REMOTO / MOVIL
echo ======================================================================
echo.
echo  [+] Abriendo tunel seguro HTTPS (https://vitalis-care.loca.lt)...
echo  [!] Clave / IP del Tunel si la solicita: 181.61.204.132
echo.
echo  ==================================================================
echo   ENLACE PARA CELULARES Y OTROS DISPOSITIVOS:
echo   https://vitalis-care.loca.lt
echo  ==================================================================
echo.
npx -y localtunnel --port 5276 --subdomain vitalis-care
pause
