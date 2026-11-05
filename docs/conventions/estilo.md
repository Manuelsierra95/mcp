---
type: Convention
title: Cómo se escribe el código aquí
description: TypeScript, ESLint, Prettier, nombres y imports. Se aplica a todo fichero TypeScript del repositorio.
tags: [estilo, typescript, eslint, prettier]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Cómo se escribe el código aquí

## TypeScript

- `strict` está activo en todo el workspace. No se apaga con `as any` ni con `// @ts-ignore`.
- Cuando el tipo no se sabe, `unknown` y se estrecha. `any` desactiva el chequeo en silencio.
- `const` por defecto. `let` solo cuando la variable cambia. `var` nunca.
- Las funciones que se exportan declaran el tipo de retorno.
- Los imports relativos llevan la extensión del fichero (`./utils.ts`), porque el runtime los ejecuta tal cual.

## ESLint y Prettier

- ESLint con la configuración compartida (`@workspace/eslint-config`). `pnpm lint` en la raíz.
- Prettier manda sobre el formato: **sin punto y coma**, comillas dobles, 2 espacios, 80 columnas, `trailingComma: es5`.
- El lint no falla por estilo: la configuraciónshared usa `only-warn`. Lo que falla es un error real.

## Nombres

| Qué | Cómo |
|---|---|
| Fichero | `kebab-case.ts`: `theme-provider.ts`, `open-pull-request.ts` |
| Componente de React | `PascalCase` en el nombre, `kebab-case` en el fichero: `ThemeProvider` en `theme-provider.tsx` |
| Función y variable | `camelCase` |
| Tipo e interfaz | `PascalCase` |
| Constante | `SCREAMING_SNAKE_CASE` |
| Hook | `useAlgo` |

## Imports

- El orden: externas primero, después las del workspace, después las relativas. Cada bloque separado por una línea en blanco.
- Los imports de un paquete del workspace usan el alias: `import { Button } from "@workspace/ui/components/button"`.
- El alias `@/` es solo de `apps/web` (lo define su `tsconfig.json`). No existe en el resto del workspace.

## Comentarios

- Un comentario explica **por qué**, no **qué**. El qué ya lo dice el código.
- Los TODO llevan a quién y a qué: `// TODO(manu): cuando exista el schema, validar aquí`.
- Si el comentario necesita un párrafo para entenderse, falta una función o falta un nombre.

## Lo que no se hace

- `console.log` como forma de depurar: rompe el ruido del output de Next.js y no sobrevive a producción.
- Comentarios de bloque comentados: el historial de git ya cuenta esa historia.
- `any` para que el compilador se calle.
