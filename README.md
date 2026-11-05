# ai-factory-v2

Monorepo del proyecto. La app es una Next.js 16 con pnpm y turbo.

## Lo primero: el BRAIN

El conocimiento del proyecto vive en [`docs/`](./docs), en formato
[OKF](https://github.com/GoogleCloudPlatform/open-knowledge-format). No es
documentación: es lo que un agente consulta **antes** de tocar código, y lo
que se actualiza **después** de cada cambio.

```bash
pnpm brain lint             # valida el bundle
pnpm brain index            # regenera los listados
pnpm brain search <query>   # busca un concepto
pnpm brain read <path>      # lee un concepto
pnpm brain context <paths>  # el contexto de trabajo para unas rutas
pnpm brain check            # la puerta: bundle válido, reglas, documentación
```

El punto de entrada es [`docs/index.md`](./docs/index.md).

## Estructura

| Ruta | Qué es |
|---|---|
| `apps/web` | La aplicación Next.js |
| `packages/ui` | Componentes compartidos |
| `packages/brain-core` | El motor del BRAIN: parseo OKF, búsqueda, índice y motor de reglas |
| `docs/` | El BRAIN |

## Comandos

```bash
pnpm install
pnpm dev        # turbo dev
pnpm lint
pnpm typecheck
pnpm test       # tests unitarios (node:test)
pnpm brain      # el CLI del BRAIN
```

## Para los agentes

El contrato está en [`AGENTS.md`](./AGENTS.md). Lo corto: **antes de escribir
código, consulta el BRAIN; después, documenta lo que pasó.** El servidor MCP
`brain` lo hace con una llamada.
