---
type: Rule
title: Los ficheros de entorno no se commitean
description: Ningún .env ni .env.local llega al repositorio. Los secretos viven en el entorno local y en el secret store del servidor.
tags: [secretos, git, entorno]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: blocker
applies_to: "**"
check:
  kind: forbidden-path
  value: "**/.env*"
  message: "Los ficheros de entorno no se versionan. Pon el valor en .env.local, que está gitignored."
---
