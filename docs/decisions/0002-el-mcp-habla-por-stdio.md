---
type: Decision
title: El servidor MCP habla por stdio
description: Por qué el servidor del BRAIN no es un servicio HTTP con su propio despliegue.
tags: [mcp, transporte, local]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0002"
date: 2026-11-05
context: >-
  El servidor MCP puede hablar por stdio o por HTTP. La tentación de HTTP es
  que "queda instalado" y no depende de cómo arranca el cliente.
options:
  - "HTTP: un proceso propio, un puerto, una configuración en cada cliente."
  - "stdio: el cliente lo arranca, no hay servicio que desplegar ni claves que guardar."
decision: >-
  stdio. El cliente arranca el servidor y este lee y escribe el repositorio
  directamente, sin red y sin autenticación.
consequences:
  - >-
    No hay servicio que desplegar, que monitorizar ni que mantener con vida
    propia.
  - >-
    Funciona igual en Claude Code, Cursor, OpenCode, Codex y Gemini CLI sin
    configuración específica.
  - >-
    El BRAIN es local por construcción: no hay una copia en un servidor que
    pueda quedar vieja.
  - >-
    El downside es que no se puede compartir el mismo servidor entre varios
    clientes a la vez. Para este caso da igual: cada uno lee el mismo repo.
---
