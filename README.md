# RedactGuard

**The Zero-Trust Data Sanitization & Compliance Suite**

RedactGuard erradica las filtraciones de datos causadas por redacciones defectuosas (pixelado, blur, cajas semitransparentes) y establece el estándar criptográfico e irreversible para la sanitización de documentos, imágenes y video.

> Lo que ocultamos, **deja de existir**. No es un editor de imágenes; es un motor de destrucción de datos selectiva.

![CI](https://github.com/jtoscano97/prueba_qsdoctor/actions/workflows/ci.yml/badge.svg)

---

## Características

- **Motor Ironclad**: Destrucción a nivel de bit con ruido criptográfico (CSPRNG). Cero interpolación.
- **Zero-Trust Auditor**: Detección de redacciones reversibles mediante análisis de entropía y FFT.
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
│   └── web/                  # Next.js (WASM client-side próximo)
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
npx redactguard audit ./documento.pdf

# Sanitizar (Rust core en integración)
npx redactguard sanitize input.png output.png
```

### Web (Next.js)

```bash
npm run dev:web
```

Abre [http://localhost:3000](http://localhost:3000)

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
| CLI | TypeScript + Commander |

---

## Licencia

MIT
