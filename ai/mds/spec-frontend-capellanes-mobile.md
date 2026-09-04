# Spec Frontend — App de Capellanes (Mobile)

> Documento de referencia para la versión mobile (React Native con Expo). Adaptado a partir de la especificación web para reflejar componentes, navegación y almacenamiento nativos.

---

## 1. Arquitectura en Mobile

El cliente mobile se conecta al mismo backend en Spring Boot y al servidor LiveKit.

```
┌──────────────────────┐       REST (JSON)        ┌──────────────────────┐
│  React Native / Expo │ ◄──────────────────────► │   Spring Boot 4.1    │
│  (Android / iOS)     │                           │   Java 21 Backend    │
│                      │                           │                      │
│   ┌──────────────┐   │                           │  ┌────────────────┐  │
│   │ AsyncStorage │   │                           │  │ CallService    │  │
│   │ Zustand      │   │                           │  │ ChaplainState  │  │
│   └──────────────┘   │                           │  └───────┬────────┘  │
│                      │                           │          │            │
│                      │                           │  ┌───────▼────────┐  │
│                      │                           │  │ LiveKit SDK    │  │
│                      │                           │  │ RoomService    │  │
│                      │                           │  └───────┬────────┘  │
│                      │                           └──────────┼───────────┘
│                      │                                      │ REST API
│                      │                           ┌──────────▼───────────┐
│                      │       WebRTC (audio)       │   LiveKit Server     │
│                      │ ◄────────────────────────► │   (Docker / VPS)     │
└──────────────────────┘                           └──────────────────────┘
```

- **Base URL dev (Emulador Android)**: `http://10.0.2.2:8080` (en lugar de `localhost` para poder conectar con la máquina host).
- **Base URL dev (Dispositivo Físico o iOS)**: IP local de la PC, ej. `http://192.168.1.X:8080`.
- **Almacenamiento**: `@react-native-async-storage/async-storage` para persistir la sesión.

---

## 2. Contrato de API y Lógica de Negocio

El contrato es el mismo detallado en `backend-api-contract.md`.

### Detección de 401 (Sesión Expirada)
Si el cliente recibe un `401 Unauthorized` en cualquier request, debe limpiar el token y redirigir inmediatamente a la pantalla de **Login**.

### Polling del Capellán (`/calls/assigned`)
- Frecuencia: Cada 4 segundos.
- Estado: Solo corre si el capellán tiene estado `ONLINE`.
- Al recibir una asignación (`200 OK`), se pasa a estado `IN_CALL`, se detiene el polling, y se navega a la pantalla de llamada.

---

## 3. Identidad Visual y UI Mobile

Siguiendo el diseño de `Theme.ts` e incorporando la elegancia de la institución:
- **Colores**:
  - Primario: `#0E3B69` (Azul Profundo)
  - Secundario: `#006A63`
  - Fondos: `#FCFBF7` / `#F9F9FF`
  - Éxito (Online): `#6FA98A`
  - Alerta: `#D9A25C`
  - Urgente (Fin de llamada): `#C1666B`
- **Tipografía**:
  - Títulos: `PlayfairDisplay_600SemiBold` / `PlayfairDisplay_700Bold`
  - Textos: `Inter_400Regular` / `Inter_600SemiBold`

---

## 4. Pantallas y Navegación

### 4.1 Pantalla de Login
- Input de Usuario y Contraseña con diseño redondeado suave y sombras sutiles.
- Redirección automática según el rol recibido (`BASIC`, `CHAPLAIN`, `CHAPLAIN_LEADER`, `SUPERUSER`).

### 4.2 Rol `BASIC` (Usuario Solicitante)
- **Home**: Botón de gran tamaño "Hablar con un capellán ahora" (`POST /calls/request`).
- **Waiting**: Pantalla de espera con animación de círculos expandiéndose e indicador de carga. Pollea el detalle de la llamada hasta pasar a `IN_PROGRESS`.
- **Call Room**: Llamada de audio/video.
- **Thanks**: Cierre amable post-llamada.

### 4.3 Rol `CHAPLAIN` (Capellán)
- **Dashboard**:
    - Switch de estado: `ONLINE` / `OFFLINE`.
    - Resumen de llamadas atendidas y duración promedio.
- **Report Form**:
    - Campos: Asunto, Categoría (Espiritual, Familiar, Personal, Crisis, Otro), Gravedad (1 a 5 con selector visual de burbujas/estrellas) y Resumen.
    - Se habilita inmediatamente al finalizar la llamada.

### 4.4 Rol `CHAPLAIN_LEADER`
- Dashboard personal del capellán.
- Pestaña / Vista adicional de "Equipo" que muestra la lista de capellanes asignados con su estado (`ONLINE`, `OFFLINE`, `IN_CALL`).

### 4.5 Rol `SUPERUSER`
- Vista de "Administración":
    - Listar todos los usuarios.
    - Crear nuevo usuario (Básico, Capellán, Líder, Superusuario).

---

## 5. Integración con LiveKit Mobile

Para la sala de llamada en React Native se utiliza el SDK `@livekit/react-native`.

1. **Configuración de Audio**: Se debe inicializar el `AudioSession` al entrar a la pantalla de llamada.
2. **Componentes**: Utilizar `RoomView` o el hook de LiveKit para enlazar los streams de audio y video.
3. **Mute y Cámara**: Botones circulares con iconos de micrófono y cámara.
4. **Finalizar**: Botón rojo destacado que realiza la llamada a `/calls/{id}/end` y luego desconecta el room.
