---
type: Decision
title: Los hooks bloquean en Claude Code y OpenCode
description: Por qué el cumplimiento se apoya en hooks del cliente y no solo en el MCP y la CI, y qué se acepta como limitación.
tags: [hooks, claude-code, opencode, gate]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0005"
date: 2026-11-05
context: >-
  Un servidor MCP no puede quitarle las herramientas nativas al cliente, así
  que no puede impedir que un agente escriba en docs/ o edite código sin
  mirar el BRAIN. La pregunta era si añadir hooks del cliente, que sí
  bloquean, y en cuáles.
options:
  - "Solo MCP + CI: la puerta está en el merge y no en el editor."
  - "MCP + CI + hooks en Claude Code y OpenCode."
  - "MCP + CI + hooks en todos los clientes que los soporten."
decision: >-
  MCP + CI + hooks en Claude Code y OpenCode. Los hooks bloquean tres
  cosas: editar código sin haber consultado el BRAIN, escribir en docs/ a
  mano, y terminar una tarea sin documentarla.
consequences:
  - >-
    En Claude Code y OpenCode el cumplimiento ya no depende de la buena
    voluntad del agente.
  - >-
    Los hooks se pueden desactivar (--bare en Claude Code, plugins off en
    OpenCode). Son una puerta, no un muro. La CI sigue siendo el suelo
    vinculante.
  - >-
    Cursor, Codex y Gemini quedan con MCP + CI. Es el suelo común, y es
    suficiente.
  - >-
    Un hook que bloquea de más se desactiva. Por eso solo se bloquea cuando
    hay cambios de código y no ha habido ninguna escritura en el BRAIN:
    nunca por estilo.
  - >-
    Los hooks son código de cliente, y se rompen cuando el cliente cambia.
    El MCP y la CI no dependen de eso.
---
