# Relevamiento de Componentes y Pantallas sin Lógica de Backend Conectada

Este documento detalla exhaustivamente todos los componentes, pantallas y acciones que han quedado implementados a nivel interfaz de usuario (UI/UX) según los diseños de Stitch pero que **no cuentan con lógica de backend o persistencia remota**, cumpliendo con la directiva del proyecto.

---

## 1. Recuperar Contraseña (`ForgotPasswordScreen.tsx`)
* **Estado:** 100% Estático / Preparado según requerimiento explícito.
* **Componentes sin lógica backend:**
  * **Envío de Código:** El botón *"Enviar Código de Recuperación"* no se comunica con ningún endpoint del backend (el endpoint `/auth/forgot-password` o recuperación de credenciales no existe en el contrato actual). Dispara un estado visual simulado (*"Instrucciones Despachadas"*).
  * **Acceso a Capellanía de Guardia 24/7:** El botón auxiliar dentro de la tarjeta de ayuda no dispara llamadas anónimas directas no autenticadas en el backend actual.

---

## 2. Registro de Usuario (`RegisterScreen.tsx`)
* **Estado:** UI completa con validaciones locales y opción *"Prefiero no decir"*.
* **Componentes sin lógica backend:**
  * **Creación de Cuenta Segura:** El botón *"Crear Mi Cuenta Segura"* valida los campos, corrobora coincidencia de contraseña y términos, pero **no envía** la petición a la API ya que no existe un endpoint de registro público (`/auth/register`) en la especificación del backend. Muestra una alerta informativa y redirige a Iniciar Sesión.

---

## 3. Contenido y Mensajes de Valor (`ContentScreen.tsx`)
* **Estado:** 100% Estático según requerimiento explícito (*"Contenido que quede estático no le agregues nada de lógica"*).
* **Componentes sin lógica backend:**
  * **Búsqueda Táctica:** El campo de búsqueda filtra localmente sin consulta remota a un catálogo o motor de búsqueda.
  * **Píldoras de Categorías:** Los filtros (*"Podcasts de Guardia"*, *"Prédicas y Homilías"*, *"Familia y Misión"*, *"Estrés Post-Servicio"*) son estáticos y no realizan peticiones HTTP para paginar contenido.
  * **Reproductor de Audio Destacado (Waveform):** La simulación de onda de sonido y los botones de reproducción/pausa conmutan estados locales de UI, sin streaming real de audio (`expo-av` o servicio HLS).
  * **Descarga Fuera de Línea:** El botón de descarga y la etiqueta *"Disponible fuera de línea (14.2 MB)"* son representaciones visuales sin almacenamiento en caché local en disco.
  * **Grid de Devocionales Rápidos y Lista de Reflexiones:** Muestran datos estáticos fieles a Stitch sin conexión a base de datos.

---

## 4. Biblia Virtual (`LecturaScreen.tsx`)
* **Estado:** Conectado a `BIBLE_DATA`, selector modal de libros/capítulos, compartir vía nativo y modo luz roja.
* **Componentes sin lógica backend:**
  * **Subrayado y Guardado en Bitácora:** Las herramientas del versículo seleccionado conmutan el estado en memoria de la sesión actual (`Set<number>`), pero no se persisten en una base de datos remota del usuario (`/users/me/highlights` o `/bitacora`).
  * **Narración de Audio:** La barra flotante inferior contiene el botón de *"Narración sobria"*, el cual conmuta un estado visual de play/pause sin conexión a un archivo de narración o motor Text-to-Speech (TTS).

---

## 5. Home (`BasicDashboard.tsx`)
* **Estado:** Conectado a `useCallStore` (`requestCall`), sala de espera animada por WebSocket/polling y llamada/chat real.
* **Componentes con lógica parcial/estática:**
  * **Roster de Capellanes de Guardia:** Muestra tarjetas con fotos y especialidades de capellanes de guardia estáticos de Stitch. Al presionar el botón de llamada, se dispara la solicitud general de guardia (`requestCall('VIDEO')`) contra el backend, el cual asigna por cola FIFO al capellán disponible (el backend no soporta selección forzada por ID de capellán en el endpoint `/calls/request`).
  * **Oración Breve (2 min) en Salmo 91:2:** El botón de audio en la tarjeta de fortaleza diaria alterna el estado visual de reproducción sin un audio real embebido.

---

## 6. Perfil Reservado (`ProfileScreen.tsx`)
* **Estado:** Conectado a `useAuthStore` (`user.username`, `user.role`, `logout`).
* **Componentes sin persistencia remota:**
  * **Protocolos de Privacidad (Switches):** Los toggles de *"Borrado automático de historial"* y *"Notificaciones Silenciosas"* operan sobre estado local de React, sin enviar mutaciones a un endpoint de preferencias del usuario (`/users/preferences`).
  * **Modo Pantalla Táctica:** Acceso secundario de emergencia que no cuenta con atajo de gesto nativo cuádruple en el SO.

---

## 7. Más / Hub de Navegación (`HubScreen.tsx`)
* **Estado:** Enrutador visual hacia Muro de Oración y Contenido.
* **Componentes sin lógica backend:**
  * **Servicios Auxiliares ("Asistencia 24/7" y "Compromiso de Secreto Pastoral"):** El botón de secreto pastoral despliega una alerta con el texto estatutario; no consulta documentación dinámica del backend.
