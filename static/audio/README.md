# audio

- `ambiente.mp3` — música de fondo del sitio, en bucle. Se activa y silencia con
  el botón de sonido del encabezado (y con el del estudio 3D: es el mismo
  interruptor, guardado en el navegador).
  Pista usada solo con fines académicos; los derechos son de sus titulares.
  Para cambiarla, reemplaza este archivo con el mismo nombre. El volumen está en
  `MUSIC_VOLUME`, dentro de `src/utils/sound.js`.

- `boton.mp3` — botones "¡Hacer mi avatar!" (los que llevan al personalizador).
- `confirmar.mp3` — botón "Terminar avatar" del estudio.

  Los dos suenan siempre, aunque la música esté silenciada: son la respuesta al
  clic. Rutas y volúmenes en la tabla `FX` de `src/utils/sound.js`.

Los demás sonidos de la interfaz (clics del estudio, guardado) no son archivos:
se sintetizan con Web Audio en `src/utils/sound.js`.
