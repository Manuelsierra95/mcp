---
type: Rule
title: Cada escenario tiene su test e2e
description: "Un AC-n de una feature tiene que aparecer en el título de un test e2e. Sin test, el escenario es una promesa."
tags: [fdd, testing, ac, reglas]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
severity: blocker
applies_to:
  - "docs/features/**"
  - "features/**"
check:
  kind: linkage
  value:
    left: "docs/features/**/*.md"
    right: "packages/tests/**/*.spec.ts"
    subject: "ac"
    mode: "left-to-right"
  message: "Cada AC-n de una feature necesita su test e2e, con el título empezando por ese AC-n."
---

Un escenario sin test no está comprobado. La regla mira los dos lados a la
vez: los `AC-n` de las features y los títulos de los tests, y exige que
todo `AC-n` de la izquierda aparezca en la derecha.
