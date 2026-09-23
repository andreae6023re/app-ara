# ARA · Comidas — versión instalable (PWA)

Esta actualización convierte ARA en una aplicación web instalable (PWA).

Archivos de este paquete:
- `index.html` → sustituir el actual.
- `manifest.webmanifest`
- `service-worker.js`
- `icon-192.png`
- `icon-512.png`
- `icon-512-maskable.png`

No hay que cambiar `app.js`, `styles.css` ni `inventario-importacion.js`; se mantienen los que ya tienes en el repositorio.

## En GitHub Pages
1. Sustituye el `index.html` actual por el de este paquete.
2. Sube al mismo directorio los otros 4 archivos.
3. Espera a que GitHub Pages publique el cambio.
4. Abre `https://andreae6023re.github.io/app-ara/`.

En Chrome/Edge aparecerá la opción de instalar ARA cuando el navegador detecte la PWA.
En móvil también puedes usar la opción de instalar / añadir a pantalla de inicio del navegador.

El `start_url` y el `scope` son relativos, por lo que funcionan con el sitio de GitHub Pages `/app-ara/`.
