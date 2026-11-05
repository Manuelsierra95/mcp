# Convenciones

## Conceptos

- [Cómo está organizado este monorepo](arquitectura.md) — Dónde vive cada cosa, qué puede importar qué, y por qué el UI compartido no se duplica. Se aplica a cualquier cambio que añada código, una dependencia o un paquete.
- [Cómo se escribe el código aquí](estilo.md) — TypeScript, ESLint, Prettier, nombres y imports. Se aplica a todo fichero TypeScript del repositorio.
- [Next.js tiene sus propias reglas](nextjs.md) — La versión de Next.js de este repo rompe cosas respecto a lo que se sabe de memoria, y regenera ficheros. Se aplica a cualquier cambio en apps/web.
- [Cómo se prueba aquí](testing.md) — Qué se prueba con e2e y qué con unit tests, y el contrato de títulos AC-n que hace el TDD verificable. Se aplica al añadir tests y al añadir functionality.
