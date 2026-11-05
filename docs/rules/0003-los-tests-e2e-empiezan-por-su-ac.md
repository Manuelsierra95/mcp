---
type: Rule
title: Cada test e2e empieza por su criterio de aceptación
description: El título del test lleva el prefijo AC-n. Es lo que permite ejecutar un solo criterio y comprobar que el test falla antes de la implementación y pasa después.
tags: [testing, e2e, ac, playwright]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
severity: major
applies_to: "packages/tests/**/*.spec.ts"
check:
  kind: required-text
  value: "test\\(\"AC-[0-9]+ · "
  message: "El título del test empieza por el id del criterio de aceptación: test(\"AC-1 · ...\")."
---
