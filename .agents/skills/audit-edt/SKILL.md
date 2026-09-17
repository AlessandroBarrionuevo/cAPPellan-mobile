---
name: audit-edt
description: Auditoría local de seguridad, idempotencia y fuga de datos en Spring Boot con CodeGraph
---

# Skill: Spring Boot Security, Idempotency & Data Exposure Audit (100% Local)

## Directiva Estricta de Privacidad y Ejecución Local
- **Cero Exposición Externa:** Toda la indexación de CodeGraph, el análisis de código y la generación de reportes se deben realizar de manera **100% local** en el sistema de archivos del usuario.
- **Prohibición de Transmisión de Datos:** Queda estrictamente prohibido enviar, transmitir, subir o exponer el código fuente, la estructura AST, los artefactos, logs o los resultados de la auditoría a servidores externos, endpoints de telemetría o APIs de terceros.

## Propósito
Auditar exclusivamente el backend Java con Spring Boot y Spring Security mediante CodeGraph para detectar falta de permisos en endpoints sensibles, problemas de idempotencia, errores en la lógica de seguridad y fugas de datos sensibles en las respuestas HTTP, omitiendo cualquier análisis o ejecución de pruebas unitarias.

## Instrucciones para el Agente

### Paso 1: Mapeo Completo con CodeGraph (Entorno Local)
1. Ejecuta y consulta obligatoriamente `codegraph` en local para indexar y rastrear el AST del proyecto sin egress de red.
2. Localiza todas las clases anotadas con `@RestController` y `@Controller`.
3. Mapea la totalidad de los métodos expuestos y sus mapeos de ruta (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`).

### Paso 2: Análisis Estático de Seguridad y Lógica en Controllers
Utiliza `codegraph` localmente para analizar el código fuente de cada controller y evaluar los siguientes cuatro puntos:

1. **Permisos en Endpoints Sensibles:**
   - Detecta endpoints que realicen operaciones críticas (modificación de datos, eliminación, acceso a información sensible o de administración).
   - Verifica si poseen anotaciones explícitas de seguridad (`@PreAuthorize`, `@Secured`, `@RolesAllowed`).
   - Rastrea mediante `codegraph` la clase de configuración de `SecurityFilterChain` o `WebSecurityConfigurerAdapter` para comprobar si la URL tiene reglas globales asignadas (`hasRole`, `authenticated()`) o si quedó expuesta por defecto (`permitAll()`).

2. **Errores de Idempotencia:**
   - Examina endpoints con métodos HTTP `POST`, `PUT`, `DELETE` o `PATCH`.
   - Identifica métodos que realicen mutaciones en la base de datos sin mecanismos para evitar ejecuciones duplicadas (falta de tokens de idempotencia, transacciones no atómicas o ausencia de bloqueos/constraints únicos).
   - Detecta peticiones `GET` que modifiquen estado en la base de datos (violación del estándar de idempotencia/seguridad HTTP).

3. **Fallos de Lógica de Seguridad:**
   - **Autorización a nivel de objeto (BOLA/IDOR):** Comprueba si el controller recibe un ID por parámetro y consulta el servicio sin verificar que el ID pertenezca al usuario autenticado (extraído del `SecurityContextHolder` o `@AuthenticationPrincipal`).
   - **Validación de Entradas:** Detecta DTOs o parámetros de entrada que carezcan de `@Valid` / `@Validated` o anotaciones de restricción (`@NotNull`, `@Size`, etc.).

4. **Exposición de Datos Sensibles en Respuestas (Data Leakage):**
   - **Retorno de Entidades JPA Directas:** Verifica si los métodos retornan directamente objetos `@Entity` en lugar de DTOs dedicados, lo que suele exponer internamente campos de auditoría, contraseñas hash, claves primarias o relaciones cíclicas.
   - **Información Sensible (PII/Secretos):** Revisa si los DTOs de respuesta o mapas retornan contraseñas, tokens JWT, claves secretas, DNI/SSN, emails, o números de tarjeta sin máscara o sin la anotación `@JsonIgnore` / `@JsonProperty(access = WRITE_ONLY)`.
   - **Manejo de Excepciones y Stack Traces:** Inspecciona si los controllers o el `@ControllerAdvice` retornan la traza completa del error (`e.getMessage()`, `e.printStackTrace()`) o excepciones crudas de SQL/Hibernate hacia el cliente HTTP.

### Paso 3: Benchmark y Reporte Accionable (Guardado Localmente)
Genera un informe detallado localmente (sin incluir métricas de pruebas ni cobertura):

* **Resumen Ejecutivo (Benchmark Score):**
  - Total de Controllers y Endpoints auditados.
  - % de Endpoints con seguridad explícita vs. Endpoints potencialmente expuestos.
  - Nivel Global de Riesgo (Crítico, Alto, Medio, Bajo) basado en los hallazgos.

* **Matriz de Permisos Faltantes o Débiles:**
  - Tabla con: `Controller` | `Método HTTP / Ruta` | `Línea de Código` | `Problema de Permiso Detectado`.

* **Fugas de Datos Sensibles y Riesgos de Seguridad:**
  - Detalle punto por punto con ubicación exacta (`Archivo:Línea`) de vulnerabilidades tipo BOLA/IDOR, peticiones duplicables, retornos de entidades crudas o fugas de datos sensibles en respuestas DTO.

* **Plan de Corrección y Diffs Recomendados:**
  - Código sugerido para aplicar localmente en las configuraciones de Spring Security, `@PreAuthorize`, parches DTO/`@JsonIgnore` y correcciones directas de la lógica defectuosa.