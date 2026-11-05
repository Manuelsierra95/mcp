---
type: Decision
title: Los enlaces del BRAIN son relativos
description: Por qué los enlaces entre conceptos no empiezan por barra, aunque OKF admita las dos formas.
tags: [brain, okf, enlaces]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
decision_id: "0006"
date: 2026-11-05
context: >-
  OKF admite tres formas de enlace entre conceptos: ruta relativa al bundle
  que empieza por barra, ruta relativa estándar, y URL. La forma con barra
  es la canónica del formato, pero rompe en cualquier visor que resuelva
  contra la raíz del repositorio en vez de contra la del bundle.
options:
  - "Barra inicial (/conventions/estilo.md), la forma canónica de OKF."
  - "Ruta relativa (../conventions/estilo.md)."
  - "Mezcla: barra dentro del bundle, relativa en los índices."
decision: >-
  Rutas relativas. Funcionan en el navegador, en el editor, en el visor de
  OKF y en el agente que resuelve rutas desde el fichero que leyó.
consequences:
  - >-
    Los enlaces se ven bien en GitHub, que es donde se va a leer el BRAIN la
    mayor parte de las veces.
  - >-
    Un concepto movido a otra carpeta rompe sus enlaces, y eso se ve en el
    diff. Es información, no ruido.
  - >-
    Sigue siendo OKF válido: la spec admite rutas relativas.
---
