@echo off
title Vitalis Care - Servidor Medico Central (.NET 9)
color 0B
echo ======================================================================
echo           VITALIS CARE - INICIANDO SISTEMA CLINICO
echo ======================================================================
echo.
echo  [+] Compilando e iniciando Servidor Central (.NET 9)...
echo.
echo  ==================================================================
echo   ENLACES DE ACCESO DISPONIBLES:
echo  ==================================================================
echo   * En esta misma PC:           http://localhost:5276
echo   * Desde celular en tu Wi-Fi:  http://192.168.1.7:5276
echo.
echo   Para apagar el servidor, presiona: Ctrl + C
echo  ==================================================================
echo.
dotnet run --project CitasMedicas.Web --launch-profile http
pause
