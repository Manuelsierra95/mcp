---
type: Decision
title: El BRAIN vive en docs/ en la raíz del repo
description: Por qué el bundle OKF está en docs/ y no en la raíz ni dentro de una app.
tags: [brain, okf, estructura]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0001"
date: 2026-11-05
context: >-
  El conocimiento del proyecto tiene que vivir en el repositorio, porque es lo
  único que un clon nuevo trae y lo que un agente puede leer sin pedirle
  nada a nadie. La duda era dónde: en la raíz, junto al código, o dentro de
  una app.
options:
  - "En la raíz, con index.md y las carpetas sueltas junto al código."
  - "En docs/, con las carpetas de conceptos dentro."
  - "Dentro de apps/web, que es donde hoy vive la documentación de la app."
decision: >-
  docs/ en la raíz del repo, como bundle OKF v0.2 (la spec canónica es
  GoogleCloudPlatform/open-knowledge-format; la copia bajo knowledge-catalog
  está congelada y no se usa como referencia).
consequences:
  - >-
    La raíz del repo queda limpia: el código y el conocimiento son cosas
    distintas, y se pueden mover por separado.
  - >-
    El bundle es portable: se puede copiar a otro repo sin tocar las rutas.
  - >-
    Los enlaces dentro del bundle son relativos, para que funcionen en el
    navegador y en el agente.
  - >-
    El BRAIN se versiona con el código, así que una regla y el código que la
    cumple cambian en la misma PR.
---
