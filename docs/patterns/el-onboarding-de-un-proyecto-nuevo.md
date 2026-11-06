---
type: Pattern
title: El onboarding de un proyecto nuevo
description: "Cómo un proyecto que empieza de cero consigue sus convenciones: cuatro preguntas en lenguaje llano, una elección sobre algo concreto, y cuatro convenciones escritas. Se aplica al empezar un proyecto, no al cambiar uno."
tags: [onboarding, brain, convenciones, proyecto-nuevo]
generated: { by: "humano", at: 2026-11-06T09:00:00Z }
status: stable
---

# El onboarding de un proyecto nuevo

Un proyecto que empieza de cero no tiene convenciones, y sin convenciones
cada agente decide por su cuenta. El onboarding las crea en tres pasos.

## Capa A · para todo el mundo

Cuatro preguntas, en lenguaje llano, con ejemplos. No hay jerga y no hay
formularios en blanco.

| Pregunta | Para qué |
|---|---|
| **¿Para qué va a servir?** | Decide el tipo de proyecto: web o blog, herramienta interna, app de móvil, API para otros, librería, informe. Siempre con «otro» |
| **¿Quién lo va a usar?** | Decide si hace falta login, cuentas y permisos |
| **¿Qué tiene que pasar en el primer minuto?** | La acción principal, con las palabras de la persona |
| **¿Cada cuánto cambia?** | Decide cuánto hace falta la arquitectura. «Casi nunca» permite lo simple |

## Capa B · la propuesta

Con las cuatro respuestas, la herramienta propone **uno a tres caminos**, cada
uno con lo que cuesta y dónde deja de servir. En palabras de persona, sin
siglas:

```
Has dicho: una web o un blog, para cualquiera, donde lo importante es que
alguien lea un artículo y lo comente, y cambia poco.

A · Web estática — las páginas se generan por adelantado y se publican en un
    CDN. No hay servidor que mantener.
    Coste: casi nada: un repositorio y un CDN. Cada cambio es un commit.
    Techo: cuando el contenido lo editan varias personas sin saber Git, o
    hace falta un login.

B · Web con base de datos — una web normal, con un panel donde varias
    personas publican sin tocar código.
    Coste: un servidor pequeño y una base de datos, y alguien que los
    mantenga. Los despliegues dejan de ser gratis.
    Techo: cuando hay mucho tráfico o hace falta escalar sin tocar el código.

C · Escribe tu respuesta.
Con lo que me has contado, A.
```

La persona responde **una letra**. Ha elegido sobre algo concreto, no sobre
una lista de siglas.

## Capa C · técnico (opcional)

«¿Quieres entrar en detalle técnico?» Si no, se salta. Aquí sí: lenguaje,
alojamiento, cuentas, datos y publicación. Preguntas **con opciones**, nunca
en blanco, porque una respuesta en blanco es una decisión que no se ha
tomado.

## Lo que queda escrito

Al elegir, el proyecto recibe sus cuatro convenciones:

| Convención | Qué contiene |
|---|---|
| **arquitectura** | Qué es el proyecto, el camino elegido, dónde vive cada cosa, y lo que no se cruza |
| **estilo** | Lenguaje, formato, nombres, imports, y lo que no se hace |
| **testing** | Qué se prueba y cómo, y el contrato `AC-n` |
| **framework** | Qué es el framework aquí, qué se decide con él, y qué se lee antes de escribir código |

Y una **decisión** que dice por qué ese camino y no el otro. Sin ella, dentro
de seis meses alguien pregunta por qué el proyecto es así y nadie lo sabe.

## Lo que este proyecto ya tiene

Estas cuatro convenciones **no** salieron del onboarding: el proyecto ya
existía y se escribieron a mano, con más detalle del que da una persona en
cinco minutos. El onboarding es para lo que venga.

La diferencia está en el `generated.by`: el onboarding firma
`ia-factory/brain-onboarding`, y lo escrito a mano, `humano`.
