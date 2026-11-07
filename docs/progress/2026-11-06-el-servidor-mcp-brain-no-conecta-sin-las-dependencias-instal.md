---
type: Progress
title: El servidor MCP brain no conecta sin las dependencias instaladas
description: "error: El servidor MCP brain no conecta sin las dependencias instaladas"
generated:
  by: ia-factory/brain-mcp
  at: 2026-11-06T18:19:09.700Z
status: draft
tags:
  - error
  - mcp
  - conexion
  - dependencias
  - entorno
---

**error**

Sintoma: `brain (CONNECTION_CLOSED)` en `/mcp`, y las tools `mcp__brain__*` no aparecen.

Causa: no habia `node_modules`. El servidor se lanza con `node ./packages/brain-mcp/src/index.ts` (ver `.mcp.json`), y al no poder resolver `@modelcontextprotocol/sdk` ni `@workspace/brain-core` muere nada mas arrancar. El cliente solo ve `CONNECTION_CLOSED`, que no dice nada del motivo real.

Arreglo: `pnpm install` en la raiz del repositorio. Sin eso no funcionan ni el servidor MCP, ni los hooks de `.claude/settings.json`, ni `pnpm brain`.

Como distinguirlo: ejecutar el servidor a mano, `node ./packages/brain-mcp/src/index.ts`. Si revienta con `ERR_MODULE_NOT_FOUND`, son las dependencias. Si arranca y responde al `initialize`, el problema es otro.

Un clon recien hecho no tiene `node_modules`: es el primer paso, no una excepcion.
