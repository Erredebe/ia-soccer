# Guía para agentes IA

## Alcance

Estas indicaciones aplican a todo el repositorio salvo que un subdirectorio contenga su propio `AGENTS.md`.

## Estilo general

- Mantén la documentación en español claro y con tono amistoso; el humor canallesco debe reservarse para textos narrativos del juego.
- Los commits y mensajes de PR deben ser concisos y descriptivos.
- Evita introducir dependencias externas no incluidas ya en el repositorio sin justificación clara.

## README

- El archivo `readme.md` debe centrarse exclusivamente en describir el proyecto, su instalación y uso. No lo utilices como prompt para generar código adicional.
- Cuando actualices el README, verifica que los comandos mostrados funcionen con la configuración actual del repositorio.

## Código

- Prefiere TypeScript para nuevas funcionalidades; si necesitas JavaScript, acompáñalo de tipos o comentarios que mantengan la coherencia con los modelos existentes.
- Añade pruebas en `tests/` cuando introduzcas lógica nueva.

## Documentación adicional

- El directorio `site/` contiene documentación generada con VitePress. Si lo modificas, asegúrate de actualizar la navegación y los ejemplos para que reflejen la implementación actual.
