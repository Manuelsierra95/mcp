# Reglas

## Conceptos

- [Los paquetes se importan por su API pública](0001-imports-por-la-api-publica.md) — Ningún fichero importa el interior de un paquete del workspace. Se rompe cuando el paquete cambia de sitio y no lo ve nadie.
- [Los ficheros de entorno no se commitean](0002-ficheros-de-entorno-no-se-commitean.md) — Ningún .env ni .env.local llega al repositorio. Los secretos viven en el entorno local y en el secret store del servidor.
- [Cada test e2e empieza por su criterio de aceptación](0003-los-tests-e2e-empiezan-por-su-ac.md) — El título del test lleva el prefijo AC-n. Es lo que permite ejecutar un solo criterio y comprobar que el test falla antes de la implementación y pasa después.
- [Sin console.log en la aplicación](0004-sin-console-log-en-la-aplicacion.md) — La aplicación no deja logs sueltos: rompen el output de Next.js y no sobreviven a producción. El que necesita registrar, usa el logger.
- [Cada escenario tiene su test e2e](0005-cada-escenario-tiene-su-test-e2e.md) — Un AC-n de una feature tiene que aparecer en el título de un test e2e. Sin test, el escenario es una promesa.
- [Ningún test sin escenario](0006-ningun-test-sin-escenario.md) — Un test e2e tiene que corresponder a un AC-n de una feature. Un test sin escenario es una intención, no un criterio.
- [Toda feature tiene al menos un slice](0007-toda-feature-tiene-al-menos-un-slice.md) — Una feature se entrega en trozos que valen por sí solos. Una feature sin slices se entrega entera, y eso no se puede revisar.
- [Ningún término del glosario queda sin usar](0008-ningun-termino-del-glosario-queda-sin-usar.md) — Cada término del glosario tiene que aparecer en el código o en las features. Un término que nadie usa es vocabulario muerto.
