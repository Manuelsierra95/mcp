---
type: Glossary
title: Escenario
description: "Un caso concreto de una feature, escrito en Given/When/Then, con su identificador AC-n."
tags: [fdd, glosario]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
---

# Escenario

Un caso concreto dentro de una feature: una situación que se da, una acción
y un resultado. Se escribe en Given/When/Then y lleva su identificador
`AC-n`, que es global en el proyecto.

El identificador es lo que une el escenario con su test: el título del test
empieza por el mismo `AC-n`.

Ejemplo: «Given un pedido confirmado con tres líneas / When alguien pide la
exportación / Then se descarga un CSV con esas tres líneas».
