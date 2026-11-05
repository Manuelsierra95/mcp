---
type: Decision
title: El BRAIN se escribe solo por el MCP
description: Por qué el índice y el log se generan, y por qué escribir en docs/ a mano está prohibido.
tags: [brain, mcp, workflow, git]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0004"
date: 2026-11-05
context: >-
  El índice y el log se generan, pero el contenido los escribe gente y
  agentes. Si cada uno puede escribir en docs/ como quiera, el índice se
  desincroniza en la primera semana.
options:
  - "Escribir en docs/ libremente y regenerar el índice a mano cuando alguien se acuerde."
  - "Un hook que bloquee la escritura directa en docs/, y el MCP como única vía."
  - "Un hook que bloquee, y además un linter de CI que lo compruebe."
decision: >-
  El MCP es la única vía sancionada para escribir. El hook bloquea la
  escritura directa en docs/, y el linter de CI la rechaza igual. El índice
  y el log los genera la herramienta.
consequences:
  - >-
    El índice nunca queda viejo: se regenera con cada escritura.
  - >-
    El frontmatter se valida antes de escribir, no después. Un concepto que
    no pasa el linter no entra.
  - >-
    La deduplicación de lecciones es automática: la huella decide si es una
    lección nueva o una ocurrencia más.
  - >-
    Escribir a mano sigue siendo posible (nadie puede quitarte el editor),
    pero se ve: el índice se regenera y el cambio del log aparece en el
    diff.
---
