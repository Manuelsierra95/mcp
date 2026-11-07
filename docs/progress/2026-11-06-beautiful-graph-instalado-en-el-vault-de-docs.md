---
type: Progress
title: Beautiful Graph instalado en el vault de docs/
description: Dónde quedó el plugin del grafo y cómo se activa, para que no dependa de la memoria de nadie.
generated:
  by: ia-factory/brain-mcp
  at: 2026-11-06T18:35:28.657Z
status: draft
tags:
  - brain
  - obsidian
  - grafo
  - entorno
---

El grafo de Obsidian mostraba nueve nodos con la etiqueta "index", porque los nueve listados generados se llaman `index.md` y la etiqueta de un nodo es su nombre de fichero.

Se ha instalado [Beautiful Graph](https://community.obsidian.md/plugins/beautiful-graph) v2.0.2 en `docs/.obsidian/plugins/beautiful-graph/` y se ha habilitado en `docs/.obsidian/community-plugins.json`. Sus etiquetas salen de la jerarquía de carpetas, que es lo que faltaba.

Para verlo: reiniciar Obsidian y abrir **Beautiful Graph: Open graph** desde la paleta de comandos (o el icono de órbita en la cinta). Si no carga, activarlo en Ajustes → Plugins de la comunidad. Requiere Obsidian 1.8 o superior y es de escritorio.

`docs/.obsidian/` ha entrado en `.gitignore`: es estado local de una máquina, y a partir de ahora lleva binarios de plugins dentro.

El porqué de no renombrar los listados está en `decisions/2026-11-06-los-listados-se-quedan-como-index-md-el-grafo-se-arregla-en-.md`.
