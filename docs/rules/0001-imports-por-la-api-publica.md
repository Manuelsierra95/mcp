---
type: Rule
title: Los paquetes se importan por su API pública
description: Ningún fichero importa el interior de un paquete del workspace. Se rompe cuando el paquete cambia de sitio y no lo ve nadie.
tags: [imports, workspace, api-publica]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: major
applies_to: "**/*.{ts,tsx}"
check:
  kind: forbidden-import
  value: "@workspace/ui/src/"
  message: "Importa por la API pública del paquete: @workspace/ui/components/button, no @workspace/ui/src/components/button."
---
