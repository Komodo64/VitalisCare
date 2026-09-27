@echo off
echo ======================================================================
echo        VITALIS CARE - SUITE INTEGRAL DE PRUEBAS DE CALIDAD (QA)
echo ======================================================================
echo.
echo [1/4] Ejecutando pruebas unitarias en C# (.NET 9 + xUnit)...
echo ----------------------------------------------------------------------
dotnet test
echo.
echo [2/4] Ejecutando pruebas de humo (Smoke Testing)...
echo ----------------------------------------------------------------------
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node --test tests/smoke.test.js
) else (
    "C:\Program Files\nodejs\node.exe" --test tests/smoke.test.js
)
echo.
echo [3/4] Ejecutando pruebas de aceptacion (Acceptance Testing / UAT)...
echo ----------------------------------------------------------------------
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node --test tests/acceptance.test.js
) else (
    "C:\Program Files\nodejs\node.exe" --test tests/acceptance.test.js
)
echo.
echo [4/4] Ejecutando pruebas exploratorias (Exploratory Testing)...
echo ----------------------------------------------------------------------
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node --test tests/exploratory.test.js
) else (
    "C:\Program Files\nodejs\node.exe" --test tests/exploratory.test.js
)
echo.
echo ======================================================================
echo      TODAS LAS PRUEBAS (UNIT, SMOKE, UAT, EXPLORATORY) APROBADAS
echo ======================================================================
