# Modelos del avatar (.glb)

Coloca aquí las piezas del cuerpo, cabello, rostro y ropa. Enlázalas en
`src/data/avatarOptions.js` escribiendo la ruta en el campo `model` de la opción:

    { id: 'long', name: 'Largo', model: 'models/avatar/hair_long.glb' }

Reglas para que encajen:
- Unidades en metros. La cabeza estándar mide ~1 m de diámetro (radio 0.5).
- Piezas de CABEZA (cabello, ojos, nariz, boca, orejas): origen en el centro de la cabeza.
- Piezas de CUERPO (cuerpo, camiseta, pantalón, zapatos): origen en el suelo, entre los pies.
- Nombra los materiales con su rol para que se recoloreen con la paleta:
  skin, hair, eye, mouth, shirt, pants, shoes. Otros nombres conservan su color.
- Si el archivo no existe o falla, se usa el placeholder procedural automáticamente.
