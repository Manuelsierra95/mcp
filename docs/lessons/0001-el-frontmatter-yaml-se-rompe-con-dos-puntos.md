---
type: Lesson
title: El frontmatter YAML se rompe con dos puntos sin comillas
description: Una description con dos puntos y sin comillas hace que YAML lo lea como un mapa anidado, y el concepto entero deja de parsear. El linter ahora lo dice con la solución.
tags: [brain, okf, yaml, error]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# El frontmatter YAML se rompe con dos puntos sin comillas

## Qué pasó

Al escribir la semilla del BRAIN, varias `description:` llevaban dos puntos
dentro del texto y sin comillas:

```yaml
description: Dónde vive cada cosa, qué capa habla con cuál. Se aplica a: cualquier cambio.
```

YAML lee el segundo `:` como el inicio de un mapa anidado, y el concepto
entero deja de parsearse. El error que suelta la librería es
*"Nested mappings are not allowed in compact mappings"*, que no dice qué
hacer.

## Por qué importa

Un frontmatter que no parsea es un concepto invisible: no aparece en el
índice, no sale en una búsqueda, y las reglas que dependen de él no se
evalúan. Y el síntoma (un concepto que no aparece) no señala la causa (un
coma de más).

## Qué se hace

- **Las descripciones van entre comillas** cuando llevan dos puntos. Es la
  regla de YAML, no una manía.
- **El linter dice qué hacer**: cuando el YAML falla por un mapa anidado,
  el mensaje añade *"A value with a colon has to be quoted"*, en vez de
  dejar el error crudo de la librería.

## La regla general

Un frontmatter es YAML, y YAML tiene reglas. Lo que no se puede comprobar
(no es un `check`) se puede **evitar**: dos puntos en un valor van entre
comillas, siempre.
