# Design System: Serene Grace (Spiritual Chaplain Hub)

Este documento detalla la guía visual y técnica extraída del proyecto de Stitch para su implementación en React Native.

---

## Brand & Style
El sistema de diseño está anclado en un sentido de **"Calma Institucional"**. Sirve a un contexto de capellanía cristiana donde el usuario puede encontrarse en un estado de angustia, reflexión o buscando consejo espiritual. La interfaz de usuario debe sentirse como un espacio sagrado y silencioso: estable y autoritario, pero profundamente amable.

El estilo es una mezcla de **Minimalism** y **Corporativo Moderno**, utilizando espacios en blanco generosos para reducir la carga cognitiva y tipografía de alto contraste para garantizar la accesibilidad para todos los grupos de edad. Los elementos visuales son intencionales y escasos, evitando la decoración innecesaria para mantener una atmósfera serena que fomente la confianza y el enfoque durante el ministerio por video.

---

## Colors (Paleta de Colores)

La paleta está diseñada para reducir el "ruido visual".

| Token | Valor Hex | Uso en UI |
|---|---|---|
| **background** | `#FCFBF7` (Soft Cream) / `#F9F9FF` | Base de fondo de pantallas. Evita el blanco puro para reducir fatiga visual. |
| **primary** | `#0E3B69` (Deep Slate Blue) | Autoridad institucional, cabeceras y acciones primarias. |
| **primary-container** | `#2C5282` | Contenedores primarios y estados destacados. |
| **on-primary** | `#FFFFFF` | Texto o iconos sobre elementos primarios. |
| **secondary** | `#006A63` (Muted Teal) | Elementos de soporte y estados de disponibilidad/frescura. |
| **secondary-container** | `#79F7EA` | Contenedores secundarios y badges de estado activo. |
| **on-secondary-container** | `#007169` | Texto o iconos sobre contenedores secundarios. |
| **surface** | `#F9F9FF` | Fondo de tarjetas y listas elevadas. |
| **surface-container-lowest** | `#FFFFFF` | Tarjetas puras de fondo blanco o inputs. |
| **on-surface** | `#121C2C` (Neutral Dark) | Texto principal y títulos. |
| **on-surface-variant** | `#43474F` (Charcoal Gray) | Texto secundario y etiquetas de descripción. |
| **outline** | `#737780` | Bordes finos y líneas divisorias. |
| **error** | `#BA1A1A` | Estados de error y alertas críticas. |

---

## Typography (Tipografía)

El emparejamiento clásico es **Serif-on-Sans**.
* **Playfair Display** (Serif): Proporciona un tono editorial y sofisticado para los encabezados importantes, sugiriendo una herencia de sabiduría y cuidado.
* **Inter** (Sans-serif): Utilizado para texto funcional, etiquetas de UI y lectura de formato largo para garantizar claridad y utilidad moderna.

### Escala Tipográfica (Mobile Adaptada)

* **display-lg**: `Playfair Display`, Size: `40px`, Weight: `700`, LineHeight: `48px`, LetterSpacing: `-0.02em`
* **headline-lg**: `Playfair Display`, Size: `32px`, Weight: `600`, LineHeight: `40px`
* **headline-lg-mobile**: `Playfair Display`, Size: `28px`, Weight: `600`, LineHeight: `36px`
* **headline-md**: `Playfair Display`, Size: `24px`, Weight: `600`, LineHeight: `32px`
* **body-lg**: `Inter`, Size: `18px`, Weight: `400`, LineHeight: `28px`
* **body-md**: `Inter`, Size: `16px`, Weight: `400`, LineHeight: `24px`
* **body-sm**: `Inter`, Size: `14px`, Weight: `400`, LineHeight: `20px`
* **label-caps**: `Inter`, Size: `12px`, Weight: `600`, LineHeight: `16px`, LetterSpacing: `0.05em` (Transform: Uppercase)

---

## Spacing & Layout (Espaciado y Distribución)

El diseño móvil utiliza un margen lateral amplio para generar el "Breathable Margin" (Margen de Respiro).

* **Margen Lateral de Pantalla (container-padding):** `24px` en lugar del clásico 16px.
* **Gutter (Entre columnas/elementos contiguos):** `16px`
* **stack-sm:** `8px` (Espaciado interno de items pequeños)
* **stack-md:** `16px` (Padding interno de tarjetas)
* **stack-lg:** `32px` (Margen vertical entre bloques importantes)
* **section-gap:** `48px` (Margen entre secciones mayores)

---

## Shapes & Roundness (Bordes y Formas)

Evitamos esquinas totalmente afiladas para mantener la amabilidad, pero limitamos las píldoras perfectas solo a botones e indicadores activos.

* **sm (Bordes finos/inputs/cards básicas):** `4px`
* **lg (Botones principales/tarjetas complejas):** `8px`
* **xl (Hojas modales/contenedores grandes):** `12px`
* **full (Badges/indicadores de estado):** `9999px`

---

## Components (Componentes Clave)

### 1. Buttons
* **Primary Button:** Fondo `primary` (`#0E3B69`), texto `on-primary` (`#FFFFFF`). Radio de borde `8px` (`lg`).
* **Secondary Button:** Fondo transparente, borde de 1px `primary` (`#0E3B69`), texto `primary` (`#0E3B69`).
* **Video Call Button (Call to Action):** Incluye icono de cámara. Usa `secondary` (`#006A63`) o un badge `secondary-container` con texto `on-secondary-container`.

### 2. Cards
* Fondo `surface-container-lowest` (`#FFFFFF`), bordes con radio de `4px` (`sm`), borde sutil de 1px en `#E7EEFF` u opacidad de sombra de 4% color `#0E3B69`.

### 3. Input Fields
* Estilo minimalista. Bordes suaves de 1px. En foco utiliza `secondary` (`#006A63`) para resaltar con calma.

### 4. Bottom Tab Bar
* Navegación fija en el fondo. El ítem activo se resalta dentro de un contenedor en forma de píldora con fondo `secondary-container` (`#79F7EA`) y texto en `on-secondary-container` (`#007169`).
