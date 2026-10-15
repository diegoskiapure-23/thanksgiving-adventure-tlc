# Thanksgiving Adventure — The Language College

Juego web vertical, preparado para móvil, con escenario 3D, personaje seleccionable (pavo o peregrino), cinco niveles cronometrados, puntos, clasificación aprobada y panel de revisión administrativa.

## Requisitos
- Node.js 18 o posterior
- Conexión a internet para cargar Three.js y las fuentes web (el servidor guarda resultados localmente en `scores.json`).

## Ejecutar en tu computadora
1. Descomprime el proyecto.
2. Copia el logo proporcionado a `public/logo.png` (si no se incluye en el paquete, usa el archivo de logo que acompañó el proyecto).
3. Abre una terminal en la carpeta y ejecuta `npm install`.
4. Define una clave administrativa fuerte:
   - macOS/Linux: `ADMIN_KEY='una-clave-larga-y-segura' npm start`
   - Windows PowerShell: `$env:ADMIN_KEY='una-clave-larga-y-segura'; npm start`
5. Abre `http://localhost:3000` para jugar y `http://localhost:3000/admin` para revisar resultados.

## Publicación en línea
Despliega la aplicación Node.js en un hosting que admita servidor persistente. Define `ADMIN_KEY` como variable secreta. Para una competencia real con muchos usuarios, sustituye el archivo `scores.json` por una base de datos persistente (por ejemplo PostgreSQL), activa HTTPS, límites de frecuencia, registro de auditoría y controles anti-trampas adicionales. No publiques el panel de administración con la clave predeterminada.

## Reglas incluidas
- Niveles: 60, 75, 90, 90 y 120 segundos.
- Objetos comunes suman 1 o 2 puntos; objetos dorados suman 5.
- Los resultados empiezan como `pending`. Solo los aprobados aparecen en la clasificación oficial.
- El servidor comprueba sesión, secuencia de nivel, límites de puntos por evento y velocidad de eventos.

## Importante
Este paquete es una primera versión funcional para probar el flujo del juego. La puntuación centralizada y el panel funcionan cuando se ejecuta en un servidor Node.js. Antes de anunciar una competición oficial, conviene reforzar la validación de eventos y mover los datos a una base de datos administrada.
