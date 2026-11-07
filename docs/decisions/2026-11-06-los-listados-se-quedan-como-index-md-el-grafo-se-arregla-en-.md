---
type: Decision
title: "Los listados se quedan como index.md: el grafo se arregla en el visor"
description: "Cuándo alguien pida que los nodos del grafo se llamen como sus carpetas: por qué no se renombran los ficheros generados."
generated:
  by: ia-factory/brain-mcp
  at: 2026-11-06T18:35:14.649Z
status: draft
tags:
  - brain
  - okf
  - obsidian
  - grafos
  - listados
---

El bundle tiene nueve listados generados — `docs/index.md` y uno por carpeta — y los nueve se llaman `index.md`. En Obsidian eso son nueve nodos del grafo con la misma etiqueta, y no se distinguen.

## Por qué no se renombran

La etiqueta de un nodo del grafo de Obsidian es el nombre del fichero, y solo el nombre del fichero. El núcleo de Obsidian no tiene ninguna opción de formato de etiqueta, y ni `aliases` ni `displayName` la cambian. Renombrar los listados a `conventions.md`, `patterns.md`… los haría legibles, pero:

- **OKF los declararía documentos de concepto.** El SPEC dice que solo `index.md` y `log.md` están exentos: *"All other `.md` files are concept documents"*. Un listado renombrado necesitaría frontmatter con un tipo propio, aparecería en el listado de su propia carpeta y en los recuentos, y ensuciaría la búsqueda.
- **El bundle está para los agentes, no para el grafo.** El formato lo consumen agentes; el grafo es una vista. Arreglar el grafo en el formato es arreglar el síntoma donde no está el problema.

## Qué se hace en su lugar

El arreglo va en el visor: el plugin [Beautiful Graph](https://community.obsidian.md/plugins/beautiful-graph) etiqueta los `index.md` con la jerarquía de su carpeta, que es justo lo que falta. Va instalado en el vault de `docs/`, no en el repo, y por eso `docs/.obsidian/` está en `.gitignore`.

Si algún día hay que renombrar los listados, es una decisión de formato, con su consecuencia en OKF, y lleva su número en `docs/decisions/`.
