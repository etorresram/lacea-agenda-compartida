# LACEA · Agenda compartida

Dashboard en tonos azules para elegir sesiones de LACEA 2026, consultar ponentes y afiliaciones y comparar dos recorridos.

**Estado:** implementación y pruebas locales completas; publicación del servidor pendiente. El repositorio no es todavía una web colaborativa operativa. La sincronización del código con el servidor de Sites falló por un error de conexión. Las instrucciones siguientes corresponden a la aplicación una vez desplegada.

## Uso

1. Abre la web e inicia sesión con ChatGPT.
2. Escribe tu nombre y crea una agenda compartida. Se precarga el recorrido sugerido y las seis sesiones RIDGE obligatorias para quien crea la agenda.
3. Copia el enlace de invitación y compártelo con tu acompañante.
4. Tu acompañante inicia sesión y se une. Cada persona edita únicamente sus elecciones; ambas pueden consultar los dos recorridos.

Las selecciones se guardan en una base de datos, no en el repositorio ni únicamente en el navegador. Se actualizan cada 15 segundos y con el botón Actualizar. Los enlaces de invitación permiten incorporar una segunda persona: compártelos solo con ella. Regenerar una invitación invalida el enlace anterior, pero no elimina participantes.

## Desarrollo

Node.js 22 o posterior. Sin dependencias de npm.

```sh
node scripts/build.mjs
node --test tests/server.test.mjs
```

`index.html` es la interfaz; `sessions.json`, el programa; `server.mjs`, la API. El Worker final se genera en `dist/server/index.js`. El despliegue usa Sites con almacenamiento D1 (`DB`) y las migraciones de `drizzle/`. La autenticación depende de los encabezados verificados que agrega Sites: no despliegues este backend detrás de un proxy que acepte esos encabezados desde visitantes.

GitHub aloja el código fuente. GitHub Pages por sí solo no ejecuta la API ni almacena elecciones compartidas. No contiene tokens, invitaciones ni elecciones guardadas.

## Fuentes

- [Programa LACEA–LAMES](https://apigw.oxfordabstracts.com/services/program-pdf?event_id=77168)
- [Programa RIDGE](https://ridge.org.uy/wp-content/uploads/2026/10/Programme-Summer-School-Lima-2026.pdf)

Opciones de plenarias y sesiones invitadas en los bloques disponibles del recorrido original. Las sesiones paralelas coincidentes con RIDGE no se incluyen en este conjunto. Las aulas de RIDGE y los ponentes de algunas sesiones institucionales no se detallan en las fuentes. Revisa posibles cambios del programa antes del evento.
