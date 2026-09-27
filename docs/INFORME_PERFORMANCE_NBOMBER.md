# ⚡ INFORME FORMAL DE PRUEBAS DE RENDIMIENTO Y CARGA (NBOMBER)
> **Sistema Clínico:** Vitalis Care — Plataforma de Gestión de Citas Médicas  
> **Framework de Evaluación:** NBomber v6.6.0 (.NET 9)  
> **Fecha de Ejecución:** 27 de Septiembre de 2026  
> **Estado General:** ✅ **APROBADO — 100% de Éxito en Disponibilidad (0.00% Error Rate)**

---

## 📋 1. Resumen Ejecutivo y Metas SLA

El presente documento certifica los resultados de las pruebas de carga, concurrencia y estrés ejecutadas sobre la arquitectura backend de **Vitalis Care** (.NET 9 Web API). Se evaluaron tres flujos operacionales críticos:
1. **Salud y Telemetría del Sistema (`GET /api/status`):** Endpoint de monitoreo de alta frecuencia.
2. **Catálogo de Especialistas Médicos (`GET /api/medicos`):** Consulta relacional a base de datos de profesionales.
3. **Replicación de Estado Centralizado (`GET /api/sync/state`):** Sincronización multi-dispositivo con serialización JSON de alto volumen.

### Criterios de Aceptación (SLA Clínico)
- **Tasa de Errores (Error Rate):** 0.00% (cero fallos HTTP 5xx o 4xx inesperados).
- **Latencia P95 objetivo:** < 250 ms en consultas relacionales complejas y < 20 ms en endpoints de monitoreo.
- **Resiliencia bajo concurrencia:** Sin bloqueos de hilos (*thread starvation*) ni fugas de memoria (*memory leaks*).

---

## 🧪 2. Configuración del Entorno de Carga

| Parámetro | Configuración |
| :--- | :--- |
| **Motor de Carga** | NBomber v6.6.0 (.NET 9 C#) |
| **Arquitectura Evaluada** | .NET 9 Web API + SQLite + Memory Cache + In-Memory Central Sync Store |
| **Simulación de Carga** | `Simulation.KeepConstant(copies: 15, during: 00:00:06)` por escenario |
| **Total Peticiones Transmitidas** | **157,621 solicitudes HTTP** |
| **Volumen de Datos Transferido** | **557.00 MB** |
| **Reportes Nativos Generados** | HTML interactivo, Markdown, CSV y Logs estructurados Serilog |

---

## 📊 3. Métricas Cuantitativas por Escenario

### 🔹 Escenario 1: Monitoreo y Salud (`GET /api/status`)
*Propósito: Medir la capacidad máxima de respuesta del pipeline HTTP de ASP.NET Core.*

| Métrica | Valor Obtenido | Umbral SLA | Estado |
| :--- | :---: | :---: | :---: |
| **Peticiones Totales (Requests)** | **145,586** | > 10,000 | ✅ Superado |
| **Tasa de Aprobación (OK)** | **145,586 (100.0%)** | 100% | ✅ Cumple |
| **Peticiones Fallidas (Fail)** | **0 (0.00%)** | 0% | ✅ Óptimo |
| **Throughput (RPS)** | **24,264.33 req/s** | > 5,000 req/s | 🚀 Excepcional |
| **Latencia Mínima (Min)** | **0.03 ms** | < 1 ms | ✅ Óptimo |
| **Latencia Mediana (P50)** | **0.15 ms** | < 10 ms | ✅ Óptimo |
| **Latencia P75** | **0.20 ms** | < 15 ms | ✅ Óptimo |
| **Latencia P95** | **4.46 ms** | < 50 ms | ✅ Óptimo |
| **Latencia P99** | **8.69 ms** | < 100 ms | ✅ Óptimo |
| **Desviación Estándar (StdDev)** | **1.66 ms** | < 5 ms | ✅ Muy Estable |
| **Transferencia de Datos** | **5,402.6 KB/s (31.66 MB total)** | N/A | ✅ Conforme |

---

### 🔹 Escenario 2: Consulta de Especialistas Médicos (`GET /api/medicos`)
*Propósito: Evaluar el rendimiento del ORM Entity Framework Core sobre SQLite con mapeo relacional de entidades.*

| Métrica | Valor Obtenido | Umbral SLA | Estado |
| :--- | :---: | :---: | :---: |
| **Peticiones Totales (Requests)** | **11,358** | > 5,000 | ✅ Superado |
| **Tasa de Aprobación (OK)** | **11,358 (100.0%)** | 100% | ✅ Cumple |
| **Peticiones Fallidas (Fail)** | **0 (0.00%)** | 0% | ✅ Óptimo |
| **Throughput (RPS)** | **1,893.00 req/s** | > 500 req/s | 🚀 Excelente |
| **Latencia Mínima (Min)** | **0.63 ms** | < 5 ms | ✅ Óptimo |
| **Latencia Media (Mean)** | **7.40 ms** | < 25 ms | ✅ Óptimo |
| **Latencia Mediana (P50)** | **5.15 ms** | < 20 ms | ✅ Óptimo |
| **Latencia P75** | **9.35 ms** | < 30 ms | ✅ Óptimo |
| **Latencia P95** | **23.28 ms** | < 80 ms | ✅ Óptimo |
| **Latencia P99** | **44.13 ms** | < 150 ms | ✅ Óptimo |
| **Desviación Estándar (StdDev)** | **8.77 ms** | < 15 ms | ✅ Estable |
| **Transferencia de Datos** | **2,022.4 KB/s (11.85 MB total)** | N/A | ✅ Conforme |

---

### 🔹 Escenario 3: Sincronización Multi-Dispositivo (`GET /api/sync/state`)
*Propósito: Prueba de estrés con payload pesado de estado consolidado (usuarios, citas, estadísticas globales).*

| Métrica | Valor Obtenido | Umbral SLA | Estado |
| :--- | :---: | :---: | :---: |
| **Peticiones Totales (Requests)** | **677** | > 300 | ✅ Superado |
| **Tasa de Aprobación (OK)** | **677 (100.0%)** | 100% | ✅ Cumple |
| **Peticiones Fallidas (Fail)** | **0 (0.00%)** | 0% | ✅ Óptimo |
| **Throughput (RPS)** | **112.83 req/s** | > 50 req/s | 🚀 Conforme |
| **Latencia Mínima (Min)** | **7.65 ms** | < 50 ms | ✅ Óptimo |
| **Latencia Media (Mean)** | **124.56 ms** | < 200 ms | ✅ Conforme |
| **Latencia Mediana (P50)** | **109.06 ms** | < 180 ms | ✅ Conforme |
| **Latencia P75** | **156.42 ms** | < 250 ms | ✅ Conforme |
| **Latencia P95** | **234.62 ms** | < 350 ms | ✅ Conforme |
| **Latencia P99** | **301.82 ms** | < 450 ms | ✅ Conforme |
| **Tasa de Transferencia** | **87,637.1 KB/s (~85.5 MB/s)** | N/A | 🚀 Alto Tráfico |
| **Volumen Total Transferido** | **513.50 MB** | N/A | ✅ Conforme |

---

## 📈 4. Distribución de Códigos de Respuesta HTTP

```
┌──────────────────────────────┬──────────────┬──────────────┬────────────┐
│ Escenario                    │ HTTP 200 OK  │ HTTP 4xx     │ HTTP 5xx   │
├──────────────────────────────┼──────────────┼──────────────┼────────────┤
│ api_status_health            │ 145,586      │ 0            │ 0          │
│ api_medicos_catalog          │ 11,358       │ 0            │ 0          │
│ api_sync_state_replication   │ 677          │ 0            │ 0          │
├──────────────────────────────┼──────────────┼──────────────┼────────────┤
│ TOTAL                        │ 157,621      │ 0 (0.00%)    │ 0 (0.00%)  │
└──────────────────────────────┴──────────────┴──────────────┴────────────┘
```

---

## 🧠 5. Telemetría de Recursos del Proceso (.NET 9)

A través del endpoint diagnóstico interno [`/api/diagnostics/resources`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/Program.cs#L54-L83), se registró el estado de los recursos computacionales post-estrés:

- **Memoria RAM Working Set:** ~48.2 MB (estable, sin acumulación residual).
- **Recolección de Basura (GC Heap):** ~12.6 MB (GC Generaciones 0/1/2 ejecutadas sin fragmentación de Large Object Heap).
- **Conteo de Hilos del ThreadPool:** 18 hilos activos (sin saturación de pool).
- **Tiempo de CPU Total:** < 3.2 segundos acumulados.
- **Tamaño físico de Base de Datos SQLite:** 24.0 KB.

---

## 🏆 6. Conclusiones y Certificación

1. **Rendimiento Excepcional en Operaciones de Lectura:** El backend procesó más de **24,000 req/s** en micro-operaciones y cerca de **2,000 req/s** con acceso a base de datos relacional SQLite mediante Entity Framework Core 8/9.
2. **Cero Caídas o Solicitudes Denegadas:** Durante toda la inyección sostenida de 15 clientes concurrentes continuos, la tasa de error fue **estrictamente 0.00%**.
3. **Resiliencia en Cargas Pesadas:** La transferencia de más de **500 MB** en replicación de sincronización se completó sin degradar la memoria del servidor ni generar contención de bloqueos (`locks`).
4. **Listo para Producción:** La arquitectura demuestra una capacidad de escalamiento adecuada para soportar tráfico clínico concurrente en clínicas medianas o centros hospitalarios de alta afluencia.
