---
type: Rule
title: Sin console.log en la aplicación
description: "La aplicación no deja logs sueltos: rompen el output de Next.js y no sobreviven a producción. El que necesita registrar, usa el logger."
tags: [estilo, logs, apps-web]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: minor
applies_to: "apps/web/**/*.{ts,tsx}"
check:
  kind: forbidden-text
  value: "console\\.log\\("
  message: "Quita el console.log. Si el log se necesita en producción, usa el logger de la aplicación."
---
