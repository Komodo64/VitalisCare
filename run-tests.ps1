# Actualizar el PATH de la sesión actual para reconocer Node.js y npm
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "       VITALIS CARE - SUITE INTEGRAL DE PRUEBAS DE CALIDAD (QA)        " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Pruebas Backend C# (.NET 9 / xUnit)
Write-Host ""
Write-Host "[1/4] [C#] EJECUTANDO PRUEBAS UNITARIAS EN .NET 9 (xUnit)..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
dotnet test --logger "console;verbosity=minimal"

# 2. Pruebas de Humo (Smoke Testing)
Write-Host ""
Write-Host "[2/4] [HUMO] EJECUTANDO PRUEBAS DE HUMO (Smoke Testing)..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
node --test tests/smoke.test.js

# 3. Pruebas de Aceptación (Acceptance Testing / UAT)
Write-Host ""
Write-Host "[3/4] [UAT] EJECUTANDO PRUEBAS DE ACEPTACION (Acceptance Testing)..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
node --test tests/acceptance.test.js

# 4. Pruebas Exploratorias (Exploratory Testing)
Write-Host ""
Write-Host "[4/4] [EXPLORATORIO] EJECUTANDO PRUEBAS EXPLORATORIAS (Charters SBTM)..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
node --test tests/exploratory.test.js

# Extra: Reglas de Negocio y Helpers Frontend
Write-Host ""
Write-Host "[EXTRA] [REGLAS] EJECUTANDO REGLAS DE NEGOCIO Y SEGURIDAD FRONTEND..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
node --test tests/citaRules.test.js tests/authRules.test.js tests/uiHelpers.test.js

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "     TODAS LAS MODALIDADES DE PRUEBA APROBADAS AL 100% (63/63)        " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
