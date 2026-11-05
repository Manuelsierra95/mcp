---
type: Convention
title: Cómo está organizado este monorepo
description: Dónde vive cada cosa, qué puede importar qué, y por qué el UI compartido no se duplica. Se aplica a cualquier cambio que añada código, una dependencia o un paquete.
tags: [arquitectura, monorepo, estructura]
generated: { by: "humano", at: 2026-11-05T09:00:00Z }
status: stable
---

# Cómo está organizado este monorepo

## Las dos reglas

1. **`apps/` es una aplicación; `packages/` es una librería.** Una aplicación se despliega; una librería se consume. Un paquete no depende de una aplicación, nunca.
2. **Entre paquetes se cruza por su API pública**, nunca por su interior. `@workspace/ui/components/button` sí; `@workspace/ui/src/components/button` no. La segunda rompe cuando el paquete cambia de sitio, y no la ve nadie.

## El mapa

| Ruta | Qué es | Quién depende de ella |
|---|---|---|
| `apps/web` | La aplicación Next.js. App Router, `app/` para rutas | El usuario final |
| `packages/ui` | Componentes compartidos. Lo que se usa en más de una app | Las apps |
| `packages/brain-core` | El motor del BRAIN: parseo OKF, búsqueda, índice y motor de reglas | El servidor MCP, la CI y los hooks |
| `packages/tests` | La suite e2e (Playwright). Los tests del producto | La CI |
| `docs/` | El BRAIN. El conocimiento del proyecto | Los agentes y las personas |

## Dependencias

- Cada paquete declara en su `package.json` lo que usa. Nada se resuelve por casualidad.
- Una dependencia entre paquetes del workspace va como `workspace:*`.
- Las dependencias de third-party viven en el paquete que las usa, no en la raíz. La raíz solo tiene lo que los paquetes comparten de verdad (el tooling).

## Dónde va un fichero nuevo

- Un componente que se usa en dos sitios → `packages/ui/src/components/`.
- Una función que se usa en dos sitios → `packages/ui/src/lib/`.
- Algo que solo usa `apps/web` → `apps/web/`, en la carpeta que le toca (`components/`, `lib/`, `hooks/`).
- Una regla sobre cómo trabajamos → `docs/`, y se escribe con el BRAIN, no a mano.

## Lo que no se cruza

- Una app no importa de otra app.
- `packages/ui` no importa de `apps/*`.
- Un paquete no importa el interior de otro paquete.
- El BRAIN no se importa desde el código. Se lee, no se copia: copiar una convención al código es como duplicarla, y las dos se van a la deriva.
