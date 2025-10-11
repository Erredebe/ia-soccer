# IA Soccer

IA Soccer es un simulador tipo "manager" de fútbol con tono canallesco inspirado en el folklore del fútbol español y en clásicos como PC Fútbol. El proyecto implementa un motor de partidos, decisiones de dudosa moral, gestión económica y una narrativa cargada de ironía para ofrecer temporadas llenas de drama y risas.

## Características clave

- **Motor de partidos**: simula 90 minutos en base a atributos de jugadores, táctica y estado anímico.
- **Decisiones canallas**: acciones de riesgo que impactan la reputación del club y desbloquean eventos únicos.
- **Gestión económica**: control de salarios, traspasos y finanzas semanales.
- **Narrativa dinámica**: resúmenes de prensa con sabor a tertulia futbolera castiza.
- **CLI interactivo**: demo por consola para vivir una jornada completa y tomar decisiones.

## Estructura del repositorio

- `src/types.ts`: definiciones TypeScript de jugadores, clubes, partidos y decisiones.
- `src/core/engine.ts`: motor principal de simulación de partidos.
- `src/core/reputation.ts`: lógica de reputación y consecuencias de las decisiones canallas.
- `src/core/economy.ts`: utilidades económicas y cálculo de flujos.
- `src/core/data.ts`: datos de ejemplo para arrancar la demo.
- `src/cli/index.ts`: interfaz de línea de comandos canallesca.
- `tests/`: batería de pruebas automatizadas.
- `site/`: material de documentación generado con VitePress.

## Requisitos previos

- Node.js 20 o superior.
- npm (incluido con Node.js).

## Instalación

```bash
npm install
```

Las dependencias están bloqueadas en el repositorio para facilitar la instalación en entornos sin acceso a Internet.

## Scripts disponibles

```bash
npm run build   # Compila el proyecto a JavaScript en dist/
npm run demo    # Ejecuta la demo interactiva con tsx
npm run dev     # Ejecuta el CLI con Node.js
npm test        # Lanza las pruebas unitarias con Vitest
```

## Cómo ejecutar la demo

```bash
npm install
npm run demo
```

El CLI guiará al jugador para elegir una decisión canalla y simular el partido de la jornada, narrando los sucesos con tono pícaro.

## Roadmap

- Integrar una interfaz web ligera para visualizar estadísticas y crónicas.
- Añadir guardado/recuperación del estado del club.
- Explorar la integración con modelos generativos para narrativas dinámicas.

## Contribuir

1. Haz un fork y crea una rama con tu mejora.
2. Ejecuta `npm test` para asegurarte de que todo sigue pasando.
3. Envía un pull request describiendo la funcionalidad.

¡A seguir repartiendo juego con estilo canalla!
