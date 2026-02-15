# RedactGuard

**The Zero-Trust Data Sanitization & Compliance Suite**

RedactGuard erradica las filtraciones de datos causadas por redacciones defectuosas (pixelado, blur, cajas semitransparentes) y establece el estándar criptográfico e irreversible para la sanitización de documentos, imágenes y video.

> Lo que ocultamos, **deja de existir**. No es un editor de imágenes; es un motor de destrucción de datos selectiva.

![CI](https://github.com/jtoscano97/prueba_qsdoctor/actions/workflows/ci.yml/badge.svg)

---

## Características

- **Motor Ironclad**: Destrucción a nivel de bit con ruido criptográfico (CSPRNG). Cero interpolación.
- **Zero-Trust Auditor**: Detección de redacciones reversibles (entropía, varianza, FFT).
- **PII Heurístico**: Detección de email, teléfono, IBAN, DNI, SSN.
- **100% Local**: Air-gapped by design. Sin llamadas a APIs externas.
- **Cumplimiento**: GDPR, HIPAA, SOC2, CCPA.

---

## Estructura del Proyecto

```
redactguard/
├── crates/
│   └── redactguard-core/     # Motor Rust: sanitización + auditor
├── apps/
│   ├── cli/                  # CLI para CI/CD (redactguard audit/sanitize)
│   ├── desktop/              # App Tauri (React + Rust)
│   └── web/                  # Next.js + WASM (sanitización 100% local)
├── docs/
│   └── REDACTGUARD-TECHNICAL-MASTER-DOCUMENT.md
└── package.json              # Monorepo npm workspaces
```

---

## Quickstart

### Requisitos

- Node.js ≥ 18
- Rust (para desktop y core)
- npm

### Instalación

```bash
npm install
```

### CLI

```bash
# Compilar CLI
npm run build:cli

# Auditar archivo (detectar reversibilidad)
npm run cli -- audit ./imagen.png
npm run cli -- audit ./imagen.png --json --exit-on-fail  # CI

# Sanitizar con zonas (x,y,w,h; x,y,w,h para múltiples)
npm run cli -- sanitize input.png output.png -z "10,20,100,40"

# Eliminar metadatos de PDF
npm run cli -- pdf-strip documento.pdf documento_limpio.pdf
```

### Web (Next.js + WASM)

```bash
# Compilar WASM (primera vez o tras cambios en Rust)
npm run build:wasm

npm run dev:web
```

Abre [http://localhost:3000](http://localhost:3000)

- Drop zone: arrastrar, pegar desde portapapeles
- **PII Scanner**: pega texto para detectar emails, teléfonos, IBAN, DNI, SSN
- Click en imagen para añadir zonas; arrastra para mover; +/- para redimensionar
- **Auditar**: detección de reversibilidad (entropía + varianza)
- **Sanitizar**: destrucción criptográfica, certificado SHA-256, anti-esteganografía LSB

### Desktop (Tauri)

```bash
npm run dev:desktop
```

### Rust Core (tests)

```bash
cargo test -p redactguard-core
```

---

## Uso en CI/CD

```yaml
# .github/workflows/redactguard.yml
- uses: actions/checkout@v4
- run: npm ci && npm run build:cli
- run: npx redactguard audit ./logs/ --exit-on-fail
```

---

## Documentación

Ver [REDACTGUARD-TECHNICAL-MASTER-DOCUMENT.md](docs/REDACTGUARD-TECHNICAL-MASTER-DOCUMENT.md) para:

- PRD completo y épicas
- Arquitectura y Data Flow
- Threat Model (STRIDE)
- UI/UX Blueprint
- Go-To-Market y Métricas

---

## Stack

| Capa | Tecnología |
|------|------------|
| Core | Rust (image, rand_chacha) |
| Desktop | Tauri 2 + React + Vite |
| Web | Next.js 14 |
| CLI | TypeScript + Rust binary (audit, sanitize, pdf-strip) |

---

## Licencia

MIT
