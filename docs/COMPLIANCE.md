# RedactGuard — Compliance (GDPR, HIPAA)

## Procesamiento de Datos

- **Localidad:** Todo el procesamiento ocurre en el dispositivo del usuario (navegador o CLI).
- **No persistencia:** Los archivos no se envían a servidores externos.
- **Sin telemetría de contenido:** No se recopilan datos sensibles para analytics.

## GDPR

| Artículo | Cumplimiento |
|----------|--------------|
| Art. 5 (Principios) | Minimización: solo se procesa lo necesario. |
| Art. 25 (Privacy by design) | Procesamiento local, sin transmisión. |
| Art. 32 (Seguridad) | Destrucción criptográfica, anti-esteganografía. |

## HIPAA

- **PHI:** La detección de PII/PHI es heurística (regex). Para PHI médico formal, considerar modelos especializados (V2).
- **Transmisión:** No hay transmisión de datos sensibles a terceros.

## Limitaciones

- La app no sustituye una evaluación legal de cumplimiento.
- Para entornos regulados, realizar DPIA/BIA según normativa aplicable.
