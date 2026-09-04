# Spec Frontend — App de Capellanes (Web + Mobile)

> Documento de referencia para agentes de IA (spec-driven development). Incluye el contrato de API real del backend (Spring Boot) y la guía de implementación para **dos clientes**: web y mobile.

---

## 1. Alcance: dos clientes, un mismo backend

Se van a construir **dos frontends** que consumen la misma API:

- **Web**: React + `livekit-client` / `@livekit/components-react`.
- **Mobile**: React Native con **Expo** (development build, no Expo Go — ver sección 6) + `@livekit/react-native`.

Ambos comparten la misma lógica de negocio (llamadas a la API, manejo de roles y estados) en la medida de lo posible, pero la capa visual se implementa una vez por plataforma siguiendo la misma guía de estilo (sección 3).

---

## 2. Contrato de API con el backend

> Fuente: documento de contrato entregado por el equipo de backend (`backend-api-contract.md`). Resumen orientado a lo que el frontend necesita implementar.

**Base URL dev**: `http://localhost:8080`

### 2.1 Autenticación

- `POST /auth/login` con `{ username, password }` → devuelve `{ token, role }`.
- El token es **opaco** (no JWT propio, in-memory del lado del backend) y se manda en **todas** las siguientes requests como header:
  ```
  Authorization: <token>
  ```
- Si el backend se reinicia, o si el rol del usuario cambia mientras el token está activo, el token se invalida → responde `401` → **el frontend debe detectar el 401 y forzar volver a la pantalla de login**, sin importar en qué pantalla esté el usuario.

### 2.2 Endpoints principales

| Método | Ruta | Rol requerido | Uso desde el frontend |
|---|---|---|---|
| POST | `/auth/login` | público | Login |
| POST | `/calls/request` | `BASIC` | Botón "Hablar con un capellán" |
| GET | `/calls/assigned` | `CHAPLAIN` / `CHAPLAIN_LEADER` | Polling cada 3-5 seg mientras está `ONLINE`. Devuelve `200` con la llamada o `204` sin contenido si no hay nada |
| POST | `/calls/{id}/end` | capellán asignado o `SUPERUSER` | Botón "Finalizar llamada" |
| GET | `/calls/{id}` | participantes o `SUPERUSER` | Consultar estado de una sesión |
| POST | `/chaplains/{id}/status` | el propio capellán | Switch ONLINE/OFFLINE (body: `{ "status": "ONLINE" \| "OFFLINE" }`) |
| POST | `/calls/{id}/report` | capellán asignado | Formulario de informe post-llamada |
| GET | `/calls/{id}/report` | participantes o `SUPERUSER` | Ver informe ya cargado |
| POST | `/users` | `SUPERUSER` | Panel admin: crear usuario |
| GET | `/users?role=X` | `SUPERUSER` | Panel admin: listar usuarios (filtro opcional por rol) |
| PATCH | `/users/{id}` | `SUPERUSER` | Panel admin: cambiar rol o `userId` (líder a cargo) |

**Nota importante sobre el informe**: el campo `category` es un enum obligatorio (`SPIRITUAL`, `FAMILY`, `PERSONAL`, `CRISIS`, `OTHER`) además de `subject`, `severity` (1-5) y `summary`. El formulario del capellán debe incluir un selector de categoría, no solo asunto/gravedad/resumen.

### 2.3 Formato de respuesta de `/calls/request` y `/calls/assigned`

```json
{
  "sessionId": 42,
  "livekitRoomName": "call-550e8400-e29b-...",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

El `token` es un JWT **de LiveKit**, no del backend propio — se usa directo con el SDK de LiveKit (ver sección 6), no hay que parsearlo ni tocarlo.

### 2.4 Formato de errores (consistente en toda la API)

```json
{ "error": "Mensaje legible" }
```

| Status | Situación típica |
|---|---|
| 400 | Datos faltantes o inválidos en el body |
| 401 | Falta el header `Authorization`, o el token es inválido/expiró |
| 403 | Rol incorrecto para la acción, o intento de acceder a datos de otro usuario |
| 404 | Recurso no encontrado (ej. no hay capellanes disponibles, informe inexistente) |
| 409 | Conflicto de estado (ej. intentar finalizar una llamada ya finalizada) |
| 500 | Error inesperado del servidor |

El frontend debe manejar **especialmente** el 404 de `/calls/request` (mensaje `"No chaplains available"`) con una pantalla amable, no como un error genérico — es un caso esperado del negocio, no una falla técnica.

### 2.5 Ciclo de vida de una sesión

```
WAITING ──► IN_PROGRESS ──► ENDED
```

- `WAITING`: el usuario `BASIC` está esperando; el capellán todavía no la tomó (sigue "pollable" desde `/calls/assigned`).
- `IN_PROGRESS`: ambos conectados a LiveKit, audio/video activo.
- `ENDED`: la llamada terminó; recién ahí se habilita cargar el informe.

El frontend debe reflejar visualmente estos tres estados de forma diferenciada (sección 4).

### 2.6 Matriz de roles (resumen para validar qué mostrar en cada UI)

| Acción | BASIC | CHAPLAIN | CHAPLAIN_LEADER | SUPERUSER |
|---|---|---|---|---|
| Solicitar llamada | ✅ | ❌ | ❌ | ❌ |
| Poll de llamada asignada | ❌ | ✅ | ✅ | ❌ |
| Finalizar llamada | ❌ | ✅ (propia) | ✅ (propia) | ✅ |
| Cambiar estado online/offline | ❌ | ✅ (propio) | ✅ (propio) | ❌ |
| Cargar informe | ❌ | ✅ (propia sesión) | ✅ (propia sesión) | ❌ |
| Ver informe | ✅* | ✅* | ✅* | ✅ |
| Gestión de usuarios | ❌ | ❌ | ❌ | ✅ |

`*` = solo si es participante de esa sesión puntual.

**Importante para el frontend**: esta tabla determina qué botones/pantallas mostrar según el rol logueado — no confiar solo en el backend rechazando con 403; ocultar directamente lo que el rol no puede usar, para no confundir al usuario con botones que van a fallar.

---

## 3. Identidad visual — institución religiosa, suave y elegante

El tono visual debe transmitir **calma, contención y confianza** — nada corporativo/frío ni tampoco infantil. Paleta de azules suaves sobre blanco, con degradés sutiles (no saturados).

### Paleta de colores

```css
:root {
  /* Azules principales */
  --azul-profundo: #2C4A6E;   /* headers, botones primarios, texto de énfasis */
  --azul-medio: #5B7FA6;      /* elementos secundarios, iconos */
  --azul-suave: #A9C6E8;      /* fondos de tarjetas, bordes, estados hover */
  --azul-pastel: #E4EEF8;     /* fondos de sección, superficies elevadas */

  /* Blancos y neutros */
  --blanco: #FFFFFF;
  --gris-calido: #F7FAFC;     /* fondo general de la app */
  --gris-texto: #4A5568;      /* texto secundario */
  --gris-oscuro: #1A202C;     /* texto principal */

  /* Estados funcionales (discretos, no chillones) */
  --exito: #6FA98A;           /* ej. capellán ONLINE */
  --alerta: #D9A25C;          /* ej. gravedad media */
  --urgente: #C1666B;         /* ej. gravedad alta — usar con moderación */

  /* Degradé de referencia para headers/fondos destacados */
  --degrade-principal: linear-gradient(135deg, var(--azul-profundo) 0%, var(--azul-medio) 100%);
  --degrade-suave: linear-gradient(180deg, var(--azul-pastel) 0%, var(--blanco) 100%);
}
```

### Lineamientos de estilo

- **Tipografía**: sans-serif limpia y legible (ej. `Inter`, `Lato`), prioridad total a la legibilidad. Tamaños generosos, buen interlineado.
- **Espaciado**: amplio, con "aire" entre secciones — evitar sensación de pantalla saturada, sobre todo en la pantalla de llamada.
- **Bordes**: esquinas redondeadas suaves (8-12px), sombras muy sutiles.
- **Degradé**: `--degrade-principal` en headers/login; `--degrade-suave` en pantallas que buscan transmitir calma (sala de espera, post-llamada). No abusar en botones chicos o texto.
- **Iconografía**: líneas finas, minimalista.
- **Colores de estado**: usarlos con moderación (badge chico, borde de color), no pantallas completas en rojo/naranja.

---

## 4. Pantallas por rol

### 4.1 Comunes a todos los roles
- **Login**: fondo con `--degrade-suave`, card blanca centrada con sombra suave.

### 4.2 Rol `BASIC`
- **Inicio**: botón grande "Hablar con un capellán" → `POST /calls/request`.
- **Sala de espera** (estado `WAITING`): mensaje calmo "Estamos conectándote con un capellán". Si la respuesta es 404 ("no hay capellanes disponibles"), mostrar mensaje contenido sugiriendo reintentar más tarde — no tratarlo como error técnico.
- **Sala de llamada** (estado `IN_PROGRESS`): ver sección 5.
- **Post-llamada** (estado `ENDED`): pantalla simple de cierre/agradecimiento. El usuario `BASIC` **no ve el informe** (eso lo carga y consulta solo el capellán/superuser).

### 4.3 Rol `CHAPLAIN`
- **Panel principal**: switch ONLINE/OFFLINE → `POST /chaplains/{id}/status`. Mientras está ONLINE, iniciar polling a `GET /calls/assigned` cada 3-5 segundos; detener el polling apenas llega una asignación (200), y reanudarlo cuando vuelva a ONLINE tras finalizar una llamada.
- **Sala de llamada**: ver sección 5.
- **Formulario de informe post-llamada** (solo habilitado cuando `estado=ENDED`):
  - `asunto` (texto corto).
  - `categoria` (selector: Espiritual / Familiar / Personal / Crisis / Otro).
  - `gravedad` 1 a 5 — representar como escala visual (círculos/segmentos), no input numérico crudo.
  - `resumen` (textarea breve).
  - Botón "Guardar informe" → `POST /calls/{id}/report`.
- **Historial propio**: llamadas atendidas con fecha, duración y gravedad.

### 4.4 Rol `CHAPLAIN_LEADER`
- Todo lo de `CHAPLAIN` (puede atender llamadas también) **más**:
- **Dashboard de equipo**: capellanes a su cargo con estado actual, llamadas atendidas y duración promedio — tarjetas con fondo `--azul-pastel`, números grandes.

### 4.5 Rol `SUPERUSER`
- **Gestión de usuarios**: `POST /users`, `GET /users?role=X`, `PATCH /users/{id}` (cambiar rol o reasignar `userId`/líder).
- **Estadísticas globales**: agregado de todas las llamadas del sistema.

---

## 5. Pantalla de sala de llamada (compartida BASIC/CHAPLAIN)

- Layout de **2 participantes** (llamada 1:1, sin grilla compleja).
- Controles mínimos: mute/unmute, cámara on/off, "Finalizar llamada" (`POST /calls/{id}/end`, color `--urgente` moderado).
- Diseñar para que se vea completa incluso con ambas cámaras apagadas (avatar/iniciales sobre fondo suave, no pantalla negra) — muchas de estas llamadas van a ser mayormente de audio.
- Reconexión: mensaje calmo ("Reconectando...") en vez de errores técnicos crudos.

---

## 6. Integración técnica con LiveKit (cliente)

### 6.1 Uso del token

El campo `token` recibido de `/calls/request` o `/calls/assigned` es un JWT de **LiveKit**, no del backend. Se usa directo:

```javascript
// Web
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(
  'ws://localhost:7880',   // LIVEKIT_WS_URL, por variable de entorno
  response.token,
  { autoSubscribe: true }
);
```

La URL del servidor LiveKit **no la devuelve el backend** — es configuración propia del frontend (variable de entorno), separada por ambiente:

| Entorno | URL WebSocket |
|---|---|
| Dev local | `ws://localhost:7880` |
| Producción | `wss://<dominio-o-ip-vps>:7880` |

### 6.2 Mini optimización (ya definida en el spec de backend)

Al publicar la cámara, desactivar simulcast (`simulcast: false`) — con un solo receptor en una llamada 1:1 no aporta nada y ahorra CPU de encoding.

---

## 7. Setup de Expo para Mobile (todo local, sin nube)

LiveKit **no funciona con la app Expo Go** (necesita módulos nativos de WebRTC), pero sí tiene plugin oficial para Expo mediante **development builds**. Todo esto se puede hacer 100% local, sin depender de servicios en la nube de Expo.

### 7.1 Instalación

```bash
npx expo install livekit-client @livekit/react-native @livekit/react-native-expo-plugin @livekit/react-native-webrtc @config-plugins/react-native-webrtc
```

En `app.json`:
```json
{
  "expo": {
    "plugins": ["@livekit/react-native-expo-plugin", "@config-plugins/react-native-webrtc"]
  }
}
```

### 7.2 Generar el development build local

Requiere Android Studio (o al menos el Android SDK vía command line tools) instalado una sola vez — es solo la herramienta de compilación, no se escribe Kotlin.

```bash
npx expo prebuild
npx expo run:android
```

Esto compila localmente e instala en el dispositivo/emulador tu propio "Expo Go personalizado" con LiveKit ya incluido.

### 7.3 Día a día de desarrollo

```bash
npx expo start --dev-client
```

Hot-reload normal, como con Expo Go. Solo hay que repetir `expo run:android` si se agrega una librería nativa nueva — para cambios de código JS/React normales no hace falta recompilar.

### 7.4 Generar un `.apk` instalable (para compartir con testers, ej. un capellán de prueba)

```bash
eas build --platform android --profile development --local
adb install nombre-del-archivo.apk
```
Compila 100% local (sin subir nada a la nube de Expo).

---

## 8. Plan de prueba

1. Login con un usuario de cada rol, validar que la UI oculta correctamente las acciones no permitidas según la tabla de la sección 2.6.
2. Flujo completo: `BASIC` solicita → `CHAPLAIN` recibe vía polling → ambos se conectan a LiveKit → `CHAPLAIN` finaliza → carga informe con categoría y gravedad.
3. Probar el caso "sin capellanes disponibles" (404) → debe mostrarse mensaje amable, no un error crudo.
4. Forzar un 401 (ej. reiniciar el backend con una sesión activa) → el cliente debe redirigir a login automáticamente.
5. Probar sala de llamada con ambas cámaras apagadas → debe verse completa, no vacía.
6. Dashboard de `CHAPLAIN_LEADER` con al menos 2 capellanes a cargo → confirmar que solo se ven sus datos.
7. En mobile: probar el flujo de Expo completo (prebuild → run:android → llamada real entre un dispositivo Android y el cliente web).

---

## 9. Fuera de alcance para este documento
- Definición exacta de componentes reutilizables entre web y mobile (se define durante la implementación).
- Accesibilidad avanzada (contraste WCAG AA, lectores de pantalla) — recomendable antes de producción real, no bloqueante para el MVP.
- Build para iOS (este documento cubre Android; iOS requeriría Xcode y se puede abordar como extensión posterior usando el mismo plugin de Expo).
