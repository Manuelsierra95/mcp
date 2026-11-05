---
type: Convention
title: Next.js tiene sus propias reglas
description: La versión de Next.js de este repo rompe cosas respecto a lo que se sabe de memoria, y regenera ficheros. Se aplica a cualquier cambio en apps/web.
tags: [nextjs, apps-web, gotchas]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Next.js tiene sus propias reglas

Este repositorio usa **Next.js 16.4.3**, que no es el Next.js que la mayoría de la gente conoce de memoria. Sus APIs cambiaron.

## Antes de escribir código de Next.js

**Se lee la guía de la versión instalada**, en `node_modules/next/dist/docs/`. No la de internet, no la de memoria.

```bash
ls node_modules/next/dist/docs/          # las guías de esta versión
# o, desde apps/web:
ls node_modules/next/dist/docs/
```

La razón es concreta: `next dev` **regenera `AGENTS.md`** con un bloque `nextjs-agent-rules` que dice exactamente esto. Ese bloque se re-agrega en cada `next dev`, así que no se borra: se commitea.

## El bloque de `AGENTS.md`

`AGENTS.md` lo escribe Next.js. Si hay que añadir reglas propias, van **después** del bloque `<!-- END:nextjs-agent-rules -->`, dentro de un bloque propio. Quitar el de Next.js solo hace que vuelva.

## Cosas que cambiaron

- Los App Router y los Server Components se comportan distinto a lo que se recuerda.
- `next dev` regenera `AGENTS.md` y `next-env.d.ts`.
- Los ficheros de la carpeta de la app se descubren por convención de nombre.

## El error caro

Escribir código de Next.js de memoria. La documentación de esta versión está en el repo, es local, y es lo que está instalada. Cuando algo no cuadra, la respuesta está en `node_modules/next/dist/docs/`, no en un recuerdo.

## Red de seguridad

- `pnpm --filter web typecheck` y `pnpm --filter web lint` antes de commitear.
- `pnpm --filter web build` cuando el cambio toca el build, las rutas o el server components.
