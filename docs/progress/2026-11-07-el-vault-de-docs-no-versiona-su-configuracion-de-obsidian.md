---
type: Progress
title: El vault de docs no versiona su configuración de Obsidian
description: "progress: El vault de docs no versiona su configuración de Obsidian"
generated:
  by: ia-factory/brain-mcp
  at: 2026-11-07T06:40:18.429Z
status: draft
tags:
  - progress
  - brain
  - obsidian
  - git
  - reglas
  - entorno
---

**progress**

Las notas del grafo — `decisions/2026-11-06-los-listados-se-quedan-como-index-md-el-grafo-se-arregla-en-.md` y `progress/2026-11-06-beautiful-graph-instalado-en-el-vault-de-docs.md` — decían que `docs/.obsidian/` estaba en `.gitignore`, con el motivo: "es estado local de una máquina, y a partir de ahora lleva binarios de plugins dentro". No lo estaba.

Se vio al commitear: `git status` ofrecía la carpeta entera, con `workspace.json`, el `main.js` del plugin y su `diagnostics.log`, y `git check-ignore -v docs/.obsidian/app.json` no encontraba ninguna regla. La nota afirmaba algo que no era cierto: el BRAIN lo escribe la herramienta, pero no comprueba que la realidad case con lo que dice.

Se añadió la línea al `.gitignore` y se subió en tres commits, uno por cambio lógico: el `.gitignore`, las notas con sus listados regenerados, y el renombrado del paquete raíz. `pnpm brain check` y `pnpm test` en verde antes de pushear.

Lo que queda: la puerta que de verdad cierra este hueco no es el `.gitignore`, es una regla comprobable de tipo `forbidden-path` sobre `docs/.obsidian/**`, que el motor ejecuta también sobre los ficheros sin commitear. El `.gitignore` evita el commit; la regla seguiría avisando aunque alguien lo quitara.
