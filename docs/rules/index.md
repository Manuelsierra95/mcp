# Reglas

## Conceptos

- [Los paquetes se importan por su API pública](0001-imports-por-la-api-publica.md) — Ningún fichero importa el interior de un paquete del workspace. Se rompe cuando el paquete cambia de sitio y no lo ve nadie.
- [Los ficheros de entorno no se commitean](0002-ficheros-de-entorno-no-se-commitean.md) — Ningún .env ni .env.local llega al repositorio. Los secretos viven en el entorno local y en el secret store del servidor.
- [Cada test e2e empieza por su criterio de aceptación](0003-los-tests-e2e-empiezan-por-su-ac.md) — El título del test lleva el prefijo AC-n. Es lo que permite ejecutar un solo criterio y comprobar que el test falla antes de la implementación y pasa después.
- [Sin console.log en la aplicación](0004-sin-console-log-en-la-aplicacion.md) — La aplicación no deja logs sueltos: rompen el output de Next.js y no sobreviven a producción. El que necesita registrar, usa el logger.
