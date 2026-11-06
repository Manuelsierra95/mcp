---
type: Rule
title: Toda feature tiene al menos un slice
description: "Una feature se entrega en trozos que valen por sí solos. Una feature sin slices se entrega entera, y eso no se puede revisar."
tags: [fdd, feature, slices, reglas]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
severity: major
applies_to:
  - "docs/features/**"
  - "features/**"
check:
  kind: forbidden-text
  value: "^(?![\\s\\S]*## Slices)"
  message: "La feature no tiene la sección '## Slices'. Trocea la feature: un slice es un trozo que se puede entregar y vale por sí solo."
---

La comprobación es un fallo de la regla: un documento de feature **sin**
`## Slices` la incumple. Por eso es `forbidden-text` con un patron que
busca la ausencia, y no `required-text`, que solo miraría si algún fichero
del ambito tiene la seccion.

Un slice que no se puede usar por si solo no es un slice, es una parte.
