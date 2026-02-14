# RedactGuard: The Zero-Trust Data Sanitization & Compliance Suite

## Documento Técnico Maestro v1.0

**Comité de Expertos:** VP of Product | CISO | Principal Systems Architect | Lead UI/UX Designer  
**Fecha:** Febrero 2025  
**Clasificación:** Confidencial — Uso Interno

---

# Tabla de Contenidos

1. [Product Requirements Document (PRD)](#1-product-requirements-document-prd)
2. [Diseño Arquitectónico de Software](#2-diseño-arquitectónico-de-software)
3. [Threat Model y Mitigaciones (STRIDE)](#3-threat-model-y-mitigaciones-stride)
4. [UI/UX Blueprint](#4-uiux-blueprint)
5. [Go-To-Market Strategy & Pricing](#5-go-to-market-strategy--pricing)
6. [Métricas de Éxito (North Star Metrics)](#6-métricas-de-éxito-north-star-metrics)

---

# 1. Product Requirements Document (PRD)

## 1.1 Visión del Producto

RedactGuard erradica las filtraciones de datos causadas por redacciones defectuosas y establece el estándar criptográfico e irreversible para la sanitización de documentos, imágenes y video en entornos corporativos, legales y gubernamentales.

---

## 1.2 Las 4 Épicas Principales

### Épica 1: Motor de Sanitización "Ironclad"
**Objetivo:** Garantizar matemáticamente que los datos sensibles eliminados dejan de existir en el archivo resultante, sin posibilidad de recuperación.

| ID | Descripción | Alcance |
|----|-------------|---------|
| E1.1 | Destrucción a nivel de bit con ruido criptográfico | MVP |
| E1.2 | Deep PDF Flattening (eliminación de streams, XObjects, metadatos) | MVP |
| E1.3 | Data Decoys (sustitución por datos sintéticos realistas) | V2 |
| E1.4 | Soporte Multiformato (PNG, JPG, WebP, PDF, Video) | MVP (imágenes+PDF) / V2 (Video) |

---

### Épica 2: Zero-Trust Auditor
**Objetivo:** Detectar reversibilidad y vulnerabilidades estructurales en documentos antes de que sean compartidos.

| ID | Descripción | Alcance |
|----|-------------|---------|
| E2.1 | Análisis en tiempo real (portapapeles, drag & drop) | MVP |
| E2.2 | Detección de reversibilidad (entropía, Fourier) | MVP |
| E2.3 | Análisis estructural (opacidad, thumbnails, texto subyacente) | MVP |
| E2.4 | Modo X-Ray / Attacker View (heatmap forense) | MVP |

---

### Épica 3: IA de Privacidad Local (Edge AI)
**Objetivo:** Detección semántica de PII/PHI y sugerencias de redacción sin exponer datos a la nube.

| ID | Descripción | Alcance |
|----|-------------|---------|
| E3.1 | SLMs locales con ONNX Runtime (sin APIs externas) | V2 |
| E3.2 | Context-Aware Redaction (contratos, informes médicos) | V2 |
| E3.3 | Políticas DLP distribuidas por MDM | V2 |

---

### Épica 4: Integraciones y Automatización
**Objetivo:** Llevar la sanitización al punto de fuga: navegador, CI/CD y certificación forense.

| ID | Descripción | Alcance |
|----|-------------|---------|
| E4.1 | Browser Extension (Interceptor) con WASM client-side | V2 |
| E4.2 | CLI & CI/CD (GitHub Actions, pipelines) | MVP |
| E4.3 | Certificado Criptográfico de Sanitización (blockchain/DB inmutable) | V2 |

---

## 1.3 Historias de Usuario Críticas con Criterios de Aceptación

### Historia 1.1: Sanitización Irreversible de Imagen
**Como** analista legal  
**Quiero** redactar información sensible en una captura de pantalla  
**Para** compartirla con el tribunal sin riesgo de filtración

**Criterios de Aceptación (Seguridad):**
- [ ] El píxel redactado es reemplazado por ruido criptográfico (CSPRNG), no por interpolación
- [ ] No quedan metadatos EXIF/XMP rastreables en el archivo de salida
- [ ] Auditoría interna confirma que no existe correlación matemática entre original y sanitizado
- [ ] El archivo temporal se destruye con DoD 5220.22-M antes de cerrar la sesión

**Prioridad:** Must Have (MVP)

---

### Historia 1.2: Deep PDF Flattening
**Como** oficial de cumplimiento  
**Quiero** aplanar un PDF con múltiples capas y anotaciones  
**Para** eliminar texto oculto bajo rectángulos negros

**Criterios de Aceptación (Seguridad):**
- [ ] Todos los diccionarios de objetos no referenciados son eliminados
- [ ] Los XObjects ocultos (imágenes embebidas sin mostrar) son purgados
- [ ] Las capas de anotación con texto subyacente son rasterizadas o eliminadas
- [ ] Miniaturas (thumbnails) internas del PDF no contienen datos sensibles
- [ ] El PDF de salida pasa el Zero-Trust Auditor con 0 vulnerabilidades críticas

**Prioridad:** Must Have (MVP)

---

### Historia 2.1: Detección de Redacción Reversible
**Como** CISO  
**Quiero** escanear documentos antes de aprobar su publicación  
**Para** evitar que se compartan archivos con redacciones reversibles (pixelado, blur)

**Criterios de Aceptación (Seguridad):**
- [ ] El sistema detecta patrones de pixelado/blur con ≥95% precisión (basado en transformadas de Fourier)
- [ ] Se alerta sobre cajas con opacidad < 100%
- [ ] Se identifican thumbnails residuales que muestran contenido sin censura
- [ ] El análisis se ejecuta 100% local, sin subida de archivos

**Prioridad:** Must Have (MVP)

---

### Historia 2.2: Vista X-Ray (Attacker View)
**Como** auditor forense  
**Quiero** ver un mapa de calor de vulnerabilidades extraíbles  
**Para** priorizar qué zonas redactar primero

**Criterios de Aceptación (Seguridad):**
- [ ] El heatmap muestra coordenadas exactas de zonas de alto riesgo
- [ ] Se clasifican por severidad: Crítico (reversible), Alto (metadatos), Medio (estructura)
- [ ] La vista simula herramientas forenses estándar (binwalk, exiftool, strings)
- [ ] No se almacena ninguna copia del archivo analizado en disco persistente

**Prioridad:** Must Have (MVP)

---

### Historia 4.1: Sanitización en Pipeline CI/CD
**Como** ingeniero DevOps  
**Quiero** escanear y redactar automáticamente logs y pantallazos antes de subir a repos públicos  
**Para** cumplir con políticas de seguridad sin intervención manual

**Criterios de Aceptación (Seguridad):**
- [ ] El CLI puede ejecutarse en modo no interactivo (CI)
- [ ] Los archivos se procesan en memoria; no se escriben a disco sin cifrado
- [ ] La política de redacción es definible por archivo de configuración (YAML/JSON)
- [ ] El exit code permite fallar el pipeline si se detectan datos sensibles no sanitizados

**Prioridad:** Must Have (MVP)

---

## 1.4 Matriz MoSCoW

### MVP (Phase 1 — 6 meses)

| Categoría | Items |
|-----------|-------|
| **Must Have** | Motor Ironclad (bit destruction, PDF flattening) • Zero-Trust Auditor (análisis reversibilidad, X-Ray) • CLI para CI/CD • Procesamiento in-memory • Cumplimiento GDPR/HIPAA base • Desktop Tauri • Export sin metadatos |
| **Should Have** | Soporte PNG, JPG, PDF • Detección heurística de PII (regex/patrones) • Política de redacción por zona (manual) |
| **Could Have** | WebAssembly para preview en navegador • Soporte WebP |
| **Won't Have** | IA local • Browser extension • Data Decoys • Certificado blockchain • Video |

---

### V2 (Phase 2 — 12 meses post-MVP)

| Categoría | Items |
|-----------|-------|
| **Must Have** | IA local ONNX (PII/PHI detection) • Browser Extension • Data Decoys • Certificado criptográfico • Políticas MDM |
| **Should Have** | Soporte Video (frame-by-frame) • Context-Aware Redaction • Integración Slack/Jira |
| **Could Have** | Blockchain privado para certificados • Soporte OCR para PDF escaneados |
| **Won't Have** | Procesamiento en cloud • APIs externas de terceros |

---

# 2. Diseño Arquitectónico de Software

## 2.1 Topología del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REDACTGUARD — ZERO-TRUST ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────┐
                              │   PRESENTATION LAYER  │
                              ├──────────────────────┤
                              │  Tauri Desktop App   │  Next.js Web (WASM)
                              │  (Rust + WebView)    │  (Client-Side Processing)
                              └──────────┬───────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  ORCHESTRATION  │           │  ZERO-TRUST      │           │  EXPORT &        │
│  LAYER          │           │  AUDITOR         │           │  PROOF CENTER    │
│  (Rust Core)    │           │  (Rust Core)     │           │  (Rust Core)     │
└────────┬────────┘           └────────┬────────┘           └────────┬────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  IRONCLAD       │           │  HEURISTIC       │           │  CRYPTO         │
│  SANITIZATION   │           │  ANALYZER        │           │  CERTIFICATE    │
│  ENGINE         │           │  (Entropy, FFT)  │           │  (V2)           │
└────────┬────────┘           └────────┬────────┘           └─────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CORE RUST LIBRARIES                                      │
│  • image-rs (PNG, JPG, WebP)  • pdf-rs / lopdf  • rav1e (Video V2)              │
│  • ring / orion (Crypto)  • memsec (secure memory wipe)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  IN-MEMORY BUFFER (RAM) — No persistence. Secure wipe on drop.                   │
│  Optional: Encrypted temp for large files (AES-256-GCM, key in memory only)       │
└─────────────────────────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────────────────────────────┐
         │  EDGE AI (V2) — ONNX Runtime                            │
         │  • PII/PHI Models (transformers.js / custom)             │
         │  • 100% local, WebGPU/CPU fallback                       │
         └─────────────────────────────────────────────────────────┘
```

---

## 2.2 Principios Arquitectónicos

| Principio | Implementación |
|-----------|----------------|
| **Air-Gapped by Design** | Zero llamadas de red en el flujo core. Toda la lógica reside en binaries locales. |
| **No-Persistencia** | Buffers en RAM; uso de `memsec` para overwrite seguro. Archivos temporales con `O_TMPFILE` (Linux) o borrado DoD. |
| **Least Privilege** | Cada módulo recibe solo los datos mínimos necesarios. No hay acceso global al archivo original. |
| **Defense in Depth** | Auditor post-sanitización obligatorio antes de exportar. Doble verificación criptográfica. |

---

## 2.3 Data Flow: Módulo Ironclad (Sanitización)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 1: IMPORTACIÓN                                                              │
└──────────────────────────────────────────────────────────────────────────────────┘
  Usuario arrastra archivo / pega desde portapapeles
       │
       ▼
  [File Loader] → Carga a buffer RAM (mmap read-only si es posible)
       │
       ├──► PDF? → [PDF Parser] → Árbol de objetos, streams, XObjects
       ├──► Imagen? → [Image Decoder] → Raw bitmap (RGBA)
       └──► Rechaza formatos no soportados
       │
       ▼
  Archivo original NUNCA se escribe a disco en formato decodificado

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 2: IDENTIFICACIÓN DE ZONAS SENSIBLES                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
  Usuario define zonas manualmente (rectángulos) O política heurística (regex/patrones)
       │
       ▼
  [Zone Resolver] → Lista de coordenadas (x, y, w, h) por página/frame
       │
       ▼
  Para cada zona: marca como "destroy" (ruido) o "decoy" (V2, sustitución sintética)

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 3: DESTRUCCIÓN A NIVEL DE BIT (Imágenes)                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
  Para cada píxel en zona marcada:
       │
       ▼
  [CSPRNG] → ChaCha20 o AES-CTR con seed derivada (archivo + zona + nonce)
       │
       ▼
  Reemplazo: pixel[i] = solid_color XOR random_bytes
  (O sólido puro si política = "opaco")
       │
       ▼
  Zero interpolación. Zero gradientes. Cero correlación con vecinos.

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 4: DEEP PDF FLATTENING                                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
  [PDF Rewriter] →
       │
       ├── 1. Eliminar diccionarios /Info, /Metadata, /XMP
       ├── 2. Eliminar streams no referenciados en el árbol de páginas
       ├── 3. Rasterizar zonas redactadas a imagen bitmap (sin texto vectorial)
       ├── 4. Eliminar XObjects embebidos en capas ocultas
       ├── 5. Purgar /Thumb (thumbnails) o regenerarlas desde contenido ya sanitizado
       ├── 6. Eliminar /Annots con contenido de texto subyacente
       └── 7. Reconstruir PDF desde cero con estructura mínima
       │
       ▼
  [PDF Validator] → Verifica que no queden referencias huérfanas

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 5: NORMALIZACIÓN ANTI-ESTEGANOGRAFÍA                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
  [Export Normalizer] →
       │
       ├── Cuantizar canales de color (eliminar LSB arbitrarios)
       ├── Stripear metadatos EXIF, XMP, perfiles ICC innecesarios
       └── Comprimir con parámetros que no preserven residuos (e.g. calidad JPEG fija)
       │
       ▼
  Buffer de salida listo para escritura

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 6: EXPORTACIÓN Y DESTRUCCIÓN                                                │
└──────────────────────────────────────────────────────────────────────────────────┘
  Usuario elige ubicación de guardado
       │
       ▼
  [Secure Write] → Escribe directamente a destino (sin temp intermedio)
       │
       ▼
  [Memory Wipe] → Sobrescribe buffer RAM con zeros/random (memsec)
       │
       ▼
  Archivo original: si estaba en temp, [DoD Wipe] antes de unlink
```

---

## 2.4 Data Flow: Zero-Trust Auditor

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 1: ENTRADA                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
  Archivo arrastrado / portapapeles monitoreado / archivo recién exportado
       │
       ▼
  [Input Gate] → Carga a buffer de solo lectura en RAM

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 2: ANÁLISIS DE REVERSIBILIDAD                                               │
└──────────────────────────────────────────────────────────────────────────────────┘
  [Reversibility Detector] (por tipo de archivo):
       │
       ├── Imagen:
       │     ├── FFT en ventanas 8x8 → detectar period icidad de pixelado
       │     ├── Análisis de entropía local → ruido gaussiano de baja variación
       │     └── Detección de patrones Depix-like (cuadrícula revelable)
       │
       └── PDF:
             ├── Buscar /ToUnicode, /Identity-H con mapeos de texto
             ├── Escaneo de streams con strings de texto legible
             └── Comparar /Thumb con contenido visible (detección de thumbnails sin censura)
       │
       ▼
  Score de reversibilidad: 0–100 (100 = crítico)

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 3: ANÁLISIS ESTRUCTURAL                                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
  [Structural Analyzer] →
       │
       ├── Cajas con opacidad < 100% (alpha channel)
       ├── Capas de texto no incrustadas (outline vs embed)
       ├── Miniaturas embebidas (/Thumb en páginas)
       ├── Metadatos (EXIF, XMP) con campos sensibles
       └── Comentarios, anotaciones invisibles
       │
       ▼
  Lista de vulnerabilidades con coordenadas y severidad

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 4: MODO X-RAY (ATTACKER VIEW)                                               │
└──────────────────────────────────────────────────────────────────────────────────┘
  [Heatmap Generator] →
       │
       ├── Superpone mapa de calor sobre preview del documento
       ├── Rojo = crítico (reversible / extraíble con binwalk/exiftool)
       ├── Naranja = alto (metadatos, thumbnail)
       ├── Amarillo = medio (estructura sospechosa)
       └── Verde = limpio
       │
       ▼
  Usuario interactúa (zoom, click para detalles) — todo en RAM

┌──────────────────────────────────────────────────────────────────────────────────┐
│  PASO 5: REPORTE Y PURGA                                                          │
└──────────────────────────────────────────────────────────────────────────────────┘
  [Report Generator] → JSON/Markdown con lista de hallazgos
       │
       ▼
  [Buffer Purge] → Destrucción segura del buffer de análisis
```

---

# 3. Threat Model y Mitigaciones (STRIDE)

## 3.1 Framework STRIDE Aplicado

| Categoría STRIDE | Amenaza | Mitigación RedactGuard |
|------------------|---------|-------------------------|
| **S**poofing | Atacante suplanta identidad del usuario para acceder a archivos | Autenticación local (biométrica/TPM en Enterprise). Archivos nunca salen del dispositivo. |
| **T**ampering | Modificación del binario o de la política de redacción | Firma de código, integridad de ejecutable. Políticas firmadas criptográficamente (MDM). |
| **R**epudiation | Usuario niega haber compartido dato sensible | Certificado de sanitización (V2) con timestamp y hash inmutable. Audit log local. |
| **I**nformation Disclosure | Filtración de datos durante procesamiento | In-memory only. No telemetría con contenido. Cifrado de swap desactivado o minimizado. |
| **D**enial of Service | Ralentizar/crash del sistema con inputs malformados | Parsers con límites estrictos (tamaño, profundidad). Timeouts. Sandboxing (seccomp). |
| **E**levation of Privilege | Escape de sandbox o acceso a memoria de otros procesos | Tauri con sandbox habilitado. Rust memory safety. Principio de least privilege en syscalls. |

---

## 3.2 Cuatro Vectores de Ataque Avanzados

### Vector 1: Recuperación por Interpolación de Vecinos
**Descripción:** Un atacante con conocimiento del algoritmo de pixelado (ej. Depix) usa la correlación entre píxeles redactados y sus vecinos para reconstruir el texto original mediante análisis de patrones de sustitución.

**Mitigación:**
- RedactGuard **nunca** usa pixelado, blur ni interpolación. El reemplazo es **ruido criptográfico puro** (CSPRNG) o color sólido.
- No existe correlación matemática entre el contenido original y el resultado. La zona redactada es estadísticamente indistinguible de ruido aleatorio.
- Verificación: Auditor incluye test de entropía; zonas sanitizadas deben tener entropía máxima.

---

### Vector 2: Extracción desde Capas Ocultas de PDF
**Descripción:** Los PDFs pueden contener múltiples capas (layers), XObjects con imágenes embebidas que no se muestran en la vista principal, y flujos de texto en `/Contents` que quedan "bajo" un rectángulo negro. Herramientas como `pdfimages` o `qpdf` pueden extraer estos contenidos.

**Mitigación:**
- **Deep PDF Flattening** reconstruye el PDF desde cero. Solo se preserva el contenido **visible post-sanitización**.
- Todos los XObjects no referenciados en la estructura final son eliminados.
- Las zonas redactadas se **rasterizan** a bitmap, destruyendo cualquier representación vectorial del texto original.
- Auditor escanea el PDF de salida buscando streams con texto legible; si encuentra, falla la certificación.

---

### Vector 3: Esteganografía en Bits Menos Significativos (LSB)
**Descripción:** Un atacante podría haber embebido datos sensibles en los LSB de los canales RGB de una imagen antes de la redacción. O, inversamente, intentar usar los LSB del archivo sanitizado para filtrar información residual.

**Mitigación:**
- **Normalización anti-esteganografía** en el módulo de export: cuantización de canales que elimina variación arbitraria en LSB.
- El ruido criptográfico usado en redacciones sobrescribe **todos** los bits del píxel, no solo los visibles.
- Perfiles de color normalizados; se eliminan perfiles ICC que puedan codificar información adicional.

---

### Vector 4: Persistencia Residual en Sistema de Archivos o Swap
**Descripción:** Incluso si el procesamiento es "in-memory", el sistema operativo puede escribir páginas a swap, o el usuario podría tener un archivo temporal en `/tmp` que no se borró correctamente. Un atacante con acceso físico o malware con acceso a disco podría recuperar datos.

**Mitigación:**
- Uso de `memsec` para sobrescribir buffers con datos sensibles antes de liberar memoria.
- Archivos temporales (cuando sean inevitables para archivos muy grandes): ubicación en RAM disk (`tmpfs`) o cifrado AES-256-GCM con clave solo en memoria.
- Borrado seguro (DoD 5220.22-M) antes de `unlink` de cualquier archivo temporal.
- Documentación para entornos de alto secreto: recomendación de desactivar swap o usar swap cifrado (LUKS, encrypted swap).

---

# 4. UI/UX Blueprint

## 4.1 Identidad Visual: Cyber-Minimalist

| Elemento | Especificación |
|----------|----------------|
| **Estética** | Dev-tool premium. Inspiración: Vercel, Linear, Obsidian. |
| **Fondo** | Obsidiana (#0D0D0F), carbón (#1A1A1E). Gradientes sutiles. |
| **Acentos** | Verde neón (#00FF88) = Sanitizado/Seguro. Rojo carmesí (#FF3366) = Vulnerabilidad crítica. Amarillo (#FFCC00) = Advertencia. |
| **Tipografía** | Monoespaciada (JetBrains Mono, Fira Code) para datos, métricas, hashes. Sans (Inter, Geist) para UI. |
| **Bordes** | Finos, 1px. Color acento con opacidad baja. |

---

## 4.2 Dashboard Principal

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [Logo RedactGuard]                    Sanitize | Audit | Settings    [User]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  DROP ZONE                                                                │   │
│  │  Arrastra archivos aquí o pega desde el portapapeles                      │   │
│  │  PNG, JPG, PDF — Max 50MB                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─ RECIENTES ─────────────────────────────────────────────────────────────┐   │
│  │  📄 contrato_NDA.pdf        ✅ Sanitizado    hace 2h                      │   │
│  │  🖼 screenshot.png           ⚠ En auditoría   hace 5h                      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─ ESTADO RÁPIDO ─────────────────────────────────────────────────────────┐   │
│  │  Portapapeles: [●] Monitoreado  |  Última sanitización: 0 vulnerabilidades  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Interacciones clave:**
- Drag & drop con feedback visual (borde verde al sobrevolar)
- Portapapeles: badge indicando si hay contenido sensible detectado
- Click en reciente → abre en modo edición/auditoría

---

## 4.3 X-Ray Auditor Mode

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [← Volver]   X-Ray Auditor — contrato_NDA.pdf                    [Export Safe]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─ DOCUMENTO CON HEATMAP ─────────────┐  ┌─ HALLAZGOS ──────────────────────┐ │
│  │                                     │  │                                   │ │
│  │   [Vista previa con overlay]        │  │  🔴 CRÍTICO (2)                    │ │
│  │   Zonas en rojo/naranja/amarillo    │  │  • Línea 3: Texto reversible       │ │
│  │   según severidad                   │  │  • Pág 2: Thumbnail sin censura    │ │
│  │                                     │  │                                   │ │
│  │   [Cursor muestra coordenadas]      │  │  🟠 ALTO (1)                       │ │
│  │                                     │  │  • Metadatos EXIF con GPS         │ │
│  │   [Animación: escaneo láser al      │  │                                   │ │
│  │    activar "Deep Scan"]             │  │  🟡 MEDIO (0)                      │ │
│  │                                     │  │                                   │ │
│  └────────────────────────────────────┘  └───────────────────────────────────┘ │
│                                                                                 │
│  [ Iniciar Deep Scan ]  [ Aplicar Sanitización a Zonas Marcadas ]               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Interacciones clave:**
- Click en hallazgo → centra vista y resalta zona en documento
- "Deep Scan" dispara animación de escaneo láser (feedback visual de purga)
- Toggle para simular "Attacker View" (qué vería un forense con herramientas estándar)

---

## 4.4 Export & Proof Center

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Export & Proof — contrato_NDA_sanitized.pdf                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─ OPCIONES DE EXPORT ─────────────────────────────────────────────────────┐  │
│  │  Formato: [PDF ▼]  Calidad: [Máxima ▼]  Incluir certificado: [✓]          │  │
│  │  Destino: [/Users/.../exports/]                              [Explorar]   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─ CERTIFICADO DE SANITIZACIÓN (V2) ────────────────────────────────────────┐  │
│  │  Archivo: contrato_NDA.pdf                                                 │  │
│  │  Política: Legal-NDA-v1                                                    │  │
│  │  Timestamp: 2025-02-14T10:32:00Z                                          │  │
│  │  Hash (SHA-256): a3f2b9c1...                                              │  │
│  │  [Copiar certificado] [Ver en blockchain]                                 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  [ Cancelar ]                                    [ Exportar y Sanitizar ]       │
│                                                                                 │
│  Post-export: Animación de "escaneo láser" atravesando documento (confirmación) │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Interacciones clave:**
- Al hacer click en "Exportar y Sanitizar": animación de escaneo láser atraviesa el documento
- Certificado: hash del archivo original + política + timestamp (inmutable)
- Opción de guardar certificado en clipboard para adjuntar en emails/informes

---

# 5. Go-To-Market Strategy & Pricing

## 5.1 Estrategia de Adopción Bottom-Up

```
         FASE 1 (0-6 meses)          FASE 2 (6-12 meses)         FASE 3 (12-18 meses)
         ─────────────────           ──────────────────          ───────────────────

    Developers & DevOps          Support & Legal Teams           CISOs & Compliance
           │                              │                              │
           ▼                              ▼                              ▼
    CLI en CI/CD pipelines    Desktop app para redacciones      Auditoría enterprise
    GitHub Actions template   diarias de contratos/NDAs         Políticas centralizadas
    "Redact before push"      "Sanitize before send"             MDM + certificación
           │                              │                              │
           ▼                              ▼                              ▼
    Viral en repos open       Casos de uso específicos          RFPs, compliance audits
    source, Dev.to, HN        por industria (legal,              SOC2, HIPAA, GDPR
                              healthcare, gov)
```

**Tácticas por fase:**
1. **Developers:** Open-source del CLI (core cerrado). Integración GitHub Action oficial. Charlas en conferencias de seguridad (Black Hat, DEF CON).
2. **Support/Legal:** Integración con herramientas de ticketing. Webinars con bufetes de abogados. Case studies con firmas legales.
3. **CISOs:** Gartner/Forrester briefings. Certificaciones de terceros. Programa de referencia con descuentos.

---

## 5.2 Propuesta de Tiers

| Tier | Nombre | Precio | Targets | Features |
|------|--------|--------|---------|----------|
| **T1** | Free Edge | $0 | Developers, individuos | CLI (100 scans/mes). Auditor básico. 1 dispositivo. Sin soporte. |
| **T2** | Pro | $29/mes o $290/año | Prosumers, equipos pequeños | Desktop + CLI ilimitado. X-Ray mode. 5 dispositivos. Soporte email. |
| **T3** | Enterprise SecOps | Custom | Empresas 500+ empleados | Todo Pro + MDM. Políticas DLP. Certificado blockchain. SLA. SSO. Audit logs. |

**Upsell path:** Free → Pro (cuando superan límite o necesitan X-Ray). Pro → Enterprise (cuando legal/compliance pide centralización).

---

# 6. Métricas de Éxito (North Star Metrics)

## 6.1 North Star Principal

**"Número de documentos/archivos sanitizados sin incidentes de filtración atribuibles a redacción defectuosa"**

*Objetivo:* Cero incidentes conocidos en clientes que usan RedactGuard según best practices.

---

## 6.2 KPIs de Producto

| KPI | Definición | Target MVP | Target V2 |
|-----|------------|------------|-----------|
| **Tiempo de procesamiento local** | Segundos desde drop hasta archivo listo | < 5s (imagen 5MB) | < 3s |
| **Throughput PDF** | Páginas/segundo en flattening | ≥ 10 pp/s | ≥ 20 pp/s |
| **Adoption rate** | % de usuarios Free que convierten a Pro en 90 días | > 5% | > 8% |
| **NPS** | Net Promoter Score post-sanitización | > 40 | > 50 |

---

## 6.3 KPIs de Seguridad

| KPI | Definición | Target |
|-----|------------|--------|
| **Tasa de falsos positivos (PII)** | % de detecciones heurísticas que no son PII real | < 10% |
| **Tasa de falsos negativos (PII)** | % de PII real no detectada | < 2% |
| **Reversibilidad post-sanitización** | Auditor no debe encontrar reversibilidad en output | 0 hallazgos críticos |
| **Tiempo de detección de reversibilidad** | Auditor identificando pixelado/blur | < 2s para documento estándar |

---

## 6.4 Métricas de Negocio

| Métrica | Target Año 1 |
|---------|--------------|
| MRR (Pro + Enterprise) | $50k |
| Clientes Enterprise | 5 |
| Usuarios activos mensuales (Free) | 10,000 |
| Referencias Gartner/Forrester | Aparecer en 1 informe de mercado |

---

# Anexo: Stack Tecnológico Resumido

| Capa | Tecnología |
|------|------------|
| Core Logic | Rust (image-rs, lopdf, ring, memsec) |
| Desktop | Tauri 2.x |
| Web | Next.js 14+ |
| Client-Side Processing | WebAssembly (Rust → wasm-pack) |
| IA Local (V2) | ONNX Runtime Web, Transformers.js |
| CI/CD | GitHub Actions, npm/pip registry |

---

*Documento generado por el Comité de Expertos RedactGuard. Todos los derechos reservados.*
