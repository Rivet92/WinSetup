# WinSetup

Landing que imita un escritorio de **Windows XP** (con [XP.css](https://github.com/botoxparty/XP.css)) para automatizar la instalación de programas en Windows con **winget**.

Todo vive en este repo: la web, los scripts `*.ps1` y las listas de paquetes en `packagelists/`. Se publica en GitHub Pages.

## Estructura

- `src/` — la landing Astro.
  - `src/components/windows/` — cada ventana (las 4 páginas + los blocs de notas de las listas) se renderiza siempre en `src/layouts/Desktop.astro` y se muestra/oculta con JavaScript. Sin AJAX: todas las ventanas viven en el HTML.
  - `src/scripts/desktop.js` — visibilidad de ventanas, arrastre, minimizar/maximizar/cerrar, botones de la barra de tareas, menú de inicio y selector de idioma.
- `scripts/` — **la fuente de verdad** de las listas `packagelists/*.txt` y de la plantilla `template.ps1`. Una integración de Astro genera un `<lista>.ps1` por cada lista y los copia al sitio en cada build (`/default.ps1`, `/packagelists/*.txt`).
- `public/` — ficheros estáticos (CNAME). El favicon y el logo viven en `src/assets/`. Las copias generadas de `scripts/` están ignoradas en git.

## Uso

En PowerShell (Windows 10/11):

```powershell
iwr https://winsetup.jlerga.dev/default.ps1 -UseBasicParsing | iex
```

Cada lista tiene su propio script:

| Lista | Comando |
| --- | --- |
| default | `iwr https://winsetup.jlerga.dev/default.ps1 -UseBasicParsing \| iex` |
| gaming | `iwr https://winsetup.jlerga.dev/gaming.ps1 -UseBasicParsing \| iex` |
| dev | `iwr https://winsetup.jlerga.dev/dev.ps1 -UseBasicParsing \| iex` |
| media | `iwr https://winsetup.jlerga.dev/media.ps1 -UseBasicParsing \| iex` |
| general | `iwr https://winsetup.jlerga.dev/general.ps1 -UseBasicParsing \| iex` |
## Cómo añadir una lista

1. Crea `scripts/packagelists/mi-lista.txt` con un ID de winget por línea (`#` = comentario).
2. Sube el repo. Listo: en el build se genera automáticamente `mi-lista.ps1` a partir de `scripts/template.ps1`.

## Desarrollo

```bash
pnpm install
pnpm dev        # desarrollo
pnpm build      # build estático a dist/
pnpm check      # typecheck (astro check)
pnpm preview    # probar el build
```

## Deploy (GitHub Pages)

- GitHub Actions se dispara con push a `main` (`.github/workflows/deploy.yml`, usa `withastro/action`).
- En el repo: **Settings → Pages → Source: GitHub Actions**.
- Dominio propio `winsetup.jlerga.dev`: el `public/CNAME` ya lo declara; añade en tu DNS un registro `CNAME` `winsetup` → `<usuario>.github.io`.
- `scripts/` se sirve en la raíz del sitio: `/default.ps1`, `/packagelists/default.txt`, etc.

## Analíticas

La web usa **Cloudflare Web Analytics** (sin cookies, respeta la privacidad): el beacon se inyecta en el `<head>` desde `src/layouts/Desktop.astro`. Las visitas se consultan en el panel de Cloudflare de la zona de `winsetup.jlerga.dev`.

## Créditos

- **XP.css** (MIT) — [botoxparty/XP.css](https://github.com/botoxparty/XP.css)
- Fondo de escritorio: *Un sereno campo verde bajo un cielo azul despejado*, vía [Pexels](https://www.pexels.com/es-es/foto/un-sereno-campo-verde-bajo-un-cielo-azul-despejado-37399471/).
- Windows XP / "Bliss" son marcas y propiedad de Microsoft; esto es una recreación nostálgica sin afiliación.

## Licencia

Distribuido bajo la **Beerware** (ver `LICENSE`): puedes hacer lo que quieras con esto mientras conserves el aviso; si algún día coincidimos y esto te sirve de algo, me debes una cerveza.
