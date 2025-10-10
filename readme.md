# IA Soccer — Prompt técnico para generar un simulador "manager canallesco" de fútbol

## Propósito

Este `README.md` está diseñado para ser usado como prompt técnico por otra IA (o por un equipo de desarrollo) para generar un simulador tipo "manager" de fútbol con estilo "canallesco" (humor pícaro, irreverente y muy enfocado en el ambiente del fútbol español), con toques de PC Fútbol y los últimos géneros destacados (gestión deportiva profunda, narrativa emergente, microdecisiones y mecánicas roguelite ligeras).

## Preferencia técnica

- Lenguaje preferido: TypeScript (Node.js, ESM). Puedes usar el stack que prefieras, pero provee implementaciones y ejemplos en TypeScript.
- Debe incluir: contrato (API/CLI), esquema de datos (tipos/DTOs), diseño de arquitectura (módulos), ejemplos de uso, y un pequeño runner/demo que se pueda ejecutar localmente.

## Objetivo del simulador

Crear un "manager" donde el jugador toma decisiones de entrenador/manager: fichajes, tácticas, entrenamiento, manejo de prensa, gestión económica y decisiones morales/"canallas" que afecten la reputación y resultados. El tono será castizo y con guiños al fútbol español y la tradición de PC Fútbol.

## Requisitos funcionales (alto nivel)

1. Gestión de equipo
   - Roster de jugadores con atributos (velocidad, resistencia, regate, pase, tiro, defensa, liderazgo, moral, potencial).
   - Contratos simples: salario, duración, cláusula.
2. Mecánica de partidos (resumen rápido)
   - Simulación rápida de 90 minutos basada en atributos, táctica y estado físico/moral.
   - Eventos narrativos en partido (controversias, penaltis, expulsiones) con consecuencias.
3. Decisiones "canallas"
   - Opciones de gestión moralmente grises (p. ej. ofrecer sobornos menores, filtrar rumores, presionar árbitros, inflar fisios) con riesgo/beneficio.
4. Economía
   - Ingresos (taquilla, patrocinio) y gastos (salarios, fichajes, mejoras de estadio).
5. Progresión y temporadas
   - Sistema de temporadas con transferencias, mercados y objetivos de club.
6. Narrativa y UI mínima
   - Mensajes estilo columnista deportivo, resúmenes de prensa y mini-historias.

## Requisitos técnicos

- Proyecto en TypeScript con tipos explícitos para modelos centrales.
- Interfaces claras para: simulador de partido, motor de decisiones, gestor de economía y módulo de reputación.
- Tests mínimos: 2-3 pruebas unitarias (principalmente para simulador de partido y decisiones canallas).
- README/documentación (este archivo) con un prompt para una IA que genere el código completo y ejemplos de cómo ejecutar el pequeño demo.

## Contrato mínimo (inputs/outputs)

- Entradas (inputs):
  - Estado del club (plantilla, finanzas, estadio, reputación, objetivos).
  - Configuración de partido (rival, condición local/visitante, táctica seleccionada).
  - Decisión del manager (fichaje, táctica, decisión canalla: booleano y tipo).
- Salidas (outputs):
  - Resultado del partido (goles, eventos, contribuciones de jugadores).
  - Impacto económico y reputacional de decisiones.
  - Registro/narrativa de prensa para la jornada.

## Esquema de datos (TypeScript interfaces)

Se espera que la IA genere algo como los siguientes tipos (ejemplo):

```ts
type PlayerId = string;

interface Player {
  id: PlayerId;
  name: string;
  age: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  attributes: {
    pace: number; // 0-100
    stamina: number;
    dribbling: number;
    passing: number;
    shooting: number;
    defending: number;
    leadership: number;
    potential: number; // 0-100
  };
  morale: number; // -100 a 100
  fitness: number; // 0-100
  salary: number; // mensual
}

interface ClubState {
  name: string;
  budget: number;
  stadiumCapacity: number;
  reputation: number; // -100 a 100
  squad: Player[];
  season: number;
  objectives: {
    minPosition?: number;
    cupRun?: boolean;
  };
}

interface MatchConfig {
  home: boolean;
  opponentStrength: number; // 0-100
  tactic: "defensive" | "balanced" | "attacking" | string;
}

interface MatchResult {
  goalsFor: number;
  goalsAgainst: number;
  events: Array<{ minute: number; type: string; description: string }>;
  manOfTheMatch?: PlayerId;
}
```

## Diseño de módulos sugerido

- core/
  - engine.ts — simulador de partidos y resolución de eventos
  - economy.ts — gestión de finanzas y contratos
  - reputation.ts — reputación y consecuencias canallas
  - data.ts — generación o carga de plantillas de ejemplo
- cli/
  - index.ts — runner de demo en consola (elige decisiones canallas y simula temporada)
- web/ (opcional)
  - server.ts — API mínima (Express / Fastify) que expone endpoints para simular partidos y tomar decisiones
- tests/

## Prompt para que una IA genere el código completo

Usa el siguiente prompt como entrada cuando pidas a otra IA que genere el simulador (traduce y adapta si necesario):

"Eres un desarrollador experto en TypeScript. Genera un proyecto completo llamado 'ia-soccer' que implemente un simulador manager de fútbol estilo español, con un tono 'canallesco' y mecánicas inspiradas en PC Fútbol y los últimos géneros. Debe incluir:

- Tipos TypeScript para modelos (Player, ClubState, MatchConfig, MatchResult, Contract, TransferOffer).
- Implementación de un engine de partido que simule 90 minutos con eventos y devuelva un MatchResult.
- Módulo de decisiones 'canallas' con riesgos/beneficios y efectos sobre reputación y sanciones.
- Un pequeño CLI en `cli/index.ts` que permita cargar un club de ejemplo, tomar una decisión canalla y simular un partido/temporada corta.
- 2-3 tests unitarios (jest o vitest) que cubran el engine y una decisión canalla.
- Instrucciones para ejecutar (scripts en `package.json`) y ejemplos de salida.

Pon atención a:

- Calidad de los tipos y la separación de responsabilidades.
- Comentarios en español con toques de humor/tono canallesco en mensajes y narrativas.
- No es necesario un front-end complejo; la salida por consola es suficiente, pero la arquitectura debe permitir una UI futura.

Entrega todo el código fuente, `package.json`, y un README con instrucciones de ejecución y ejemplos de uso."

## Ejemplo de narrativa y tono

La prensa y textos deben tener ese tono pícaro: frases cortas, ironía, referencias al fútbol español (p. ej. "el colegiado se hinchó a tarjetas como si fueran churros").

## Pequeños casos de uso de ejemplo

1. Simular un partido como local contra un rival más fuerte y decidir si usar una 'decisión canalla' (p. ej. pagarle a un informador). Mostrar impacto en resultado y reputación.
2. Hacer un fichaje barato con gran potencial pero historial disciplinario. Mostrar riesgo vs. recompensa.

## Calidad, pruebas y verificación

- Incluye 2-3 tests unitarios y scripts para ejecutar los tests.
- Asegúrate de que `tsc` compile sin errores y que `npm test` pase.

## Siguientes pasos y mejoras sugeridas

- Añadir UI web ligera con React/Remix/Svelte para mostrar jornadas y narrativa.
- Integrar una IA de narrativa (p. ej. LLM) para generar columnas de prensa dinámicas.
- Implementar guardado/serialize del estado del club.

## Notas finales

Este archivo debe servir como especificación para que otra IA o desarrollador genere el proyecto en TypeScript. Mantén el lenguaje en español y el tono canallesco en salidas y comentarios. Si quieres que lo ejecute y cree los archivos aquí mismo, dime y lo implemento en el workspace en TypeScript con tests y scripts de ejecución.

---

Archivo generado automáticamente como prompt técnico por petición del usuario.
