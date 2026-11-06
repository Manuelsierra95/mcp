---
type: Rule
title: Ningún test sin escenario
description: "Un test e2e tiene que corresponder a un AC-n de una feature. Un test sin escenario es una intención, no un criterio."
tags: [fdd, testing, ac, reglas]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
severity: blocker
applies_to:
  - "packages/tests/**"
  - "docs/features/**"
  - "features/**"
check:
  kind: linkage
  value:
    left: "docs/features/**/*.md"
    right: "packages/tests/**/*.spec.ts"
    subject: "ac"
    mode: "right-to-left"
  message: "Cada test e2e necesita su AC-n, y ese AC-n tiene que existir en una feature."
---

La regla contraria a la anterior, y por eso hace falta la otra: sin esta,
un test podría apuntar a un `AC-n` que no existe en ninguna feature, y
nadie se enteraría hasta que el test pasara sin comprobar nada.

Un test sin `AC-n` en el título también falla aquí: no aparece en la
izquierda.
