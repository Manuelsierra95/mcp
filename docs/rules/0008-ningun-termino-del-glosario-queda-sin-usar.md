---
type: Rule
title: Ningún término del glosario queda sin usar
description: "Cada término del glosario tiene que aparecer en el código o en las features. Un término que nadie usa es vocabulario muerto."
tags: [fdd, glosario, lenguaje-ubicuo, reglas]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
severity: minor
applies_to:
  - "docs/glossary/**"
  - "packages/**"
  - "docs/features/**"
  - "features/**"
check:
  kind: linkage
  value:
    left: "docs/glossary/**/*.md"
    right: "**/*.{ts,tsx,md}"
    subject: "term"
    mode: "left-to-right"
  message: "Hay términos del glosario que no aparecen en ninguna parte. O se usan, o se borran."
---

La mitad mecanica de "los terminos del glosario no se inventan".

Lo que **no** se puede comprobar es la otra mitad: que ningun termino nuevo
aparezca en el codigo sin estar antes en el glosario. Eso necesita a una
persona, y por eso vive en la convencion de FDD, no aqui.

Lo que si se puede comprobar es que el glosario no se llene de
vocabulario muerto: un termino que nadie usa es ruido que hace que el
glosario deje de mirarse.
