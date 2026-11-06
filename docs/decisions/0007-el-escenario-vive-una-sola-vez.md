---
type: Decision
title: El escenario vive una sola vez, en la feature del BRAIN
description: "Por qué el documento de la feature es la fuente del escenario, y el fichero .feature de Gherkin es opcional y no manda."
tags: [fdd, decision, gherkin, scenarios]
generated: { by: "humano", at: 2026-11-06T10:00:00Z }
status: stable
decision_id: "0007"
date: 2026-11-06
context: >-
  FDD define dos artefactos que parecen decir lo mismo: el documento de la
  feature (con los escenarios en Given/When/Then) y el fichero .feature de
  Gherkin. Si los dos existen y los dos mandan, se divergen: alguien
  actualiza uno y el otro se queda atrás. Y entonces el test, que es lo
  único que se ejecuta, deja de reflejar lo que dice la feature.
options:
  - "El .feature de Gherkin manda, y el documento de la feature se genera a partir de él."
  - "El documento de la feature manda, y el .feature se genera a partir de él."
  - "El documento de la feature manda, y el .feature es opcional: si existe, tiene que decir lo mismo."
decision: >-
  El escenario vive una sola vez: en el documento de la feature del BRAIN
  (docs/features/<slug>.md), con su id AC-n. El test e2e es su forma
  ejecutable, y lleva ese mismo id en el título. El fichero .feature de
  Gherkin, en features/ en la raíz, es opcional: cuando un equipo lo
  quiere, describe los mismos escenarios y lleva el id en el nombre del
  escenario (@AC-3).
consequences:
  - >-
    Una sola fuente de la verdad: la feature. El Gherkin es una
    representación, y el test es la ejecución.
  - >-
    El Gherkin no se genera, porque no hace falta: quien lo escribe lo
    escribe a mano, y una regla lo comprueba cuando divergen.
  - >-
    Cuando el Gherkin y la feature no coinciden, el test e2e manda: es lo
    único que se ejecuta, y por tanto lo único que puede decir la verdad
    sobre el comportamiento.
  - >-
    El id AC-n es la costura entre las tres cosas: feature, Gherkin y
    test.
  - >-
    La regla de que cada escenario tiene su test es la que impide que la
    feature y el test se separen. Es la que hace que esto aguante.
---
