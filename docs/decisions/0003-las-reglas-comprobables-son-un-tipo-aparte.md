---
type: Decision
title: Las reglas comprobables son un tipo aparte
description: Por qué el BRAIN tiene un tipo Rule con datos, en vez de que todas las convenciones vivan en prosa.
tags: [brain, rules, okf]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0003"
date: 2026-11-05
context: >-
  Un BRAIN de solo prosa no fuerza nada: nadie lo lee y nadie lo puede
  comprobar. La tentación era meter campos de máquina dentro de Convention y
  Pattern, para no inventar un tipo nuevo.
options:
  - "Meter severity y check dentro de Convention y Pattern."
  - "Un tipo Rule aparte, con el check en datos."
  - "Un sidecar con las reglas, fuera del bundle."
decision: >-
  Un tipo Rule aparte. El check vive en el frontmatter, en datos, y el motor
  lo evalúa sin un modelo. Lo que no se puede comprobar queda en prosa, en
  Pattern o Convention.
consequences:
  - >-
    La frontera es explícita: si necesita que alguien lo interprete, no es
    una Rule. Una Rule que depende del criterio de un humano acaba
    bloqueando cambios legítimos, y entonces desactivan la puerta para todo.
  - >-
    Los tipos de prosa quedan limpios: no llevan campos que solo el motor
    entiende.
  - >-
    El sidecar queda descartado: las reglas fuera del bundle se desincronizan
    de los patrones que las justifican.
  - >-
    Seis comprobaciones declarativas, sin más: forbidden-path,
    required-path, forbidden-import, required-import, forbidden-text y
    required-text.
---
