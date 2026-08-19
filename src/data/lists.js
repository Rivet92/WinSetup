import { readFileSync } from "node:fs";
import { join } from "node:path";

export const BASE = "https://winsetup.jlerga.dev";
export const GITHUB_URL = "https://github.com/rivet92/winsetup";

const ROOT = process.cwd();

function readPackages(id) {
  const content = readFileSync(
    join(ROOT, "scripts", "packagelists", `${id}.txt`),
    "utf8",
  );
  const packages = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  for (const pkg of packages) {
    // Los IDs de winget son "Publicador.Paquete" (solo letras, digitos, . - _ +).
    if (!pkg.includes(".") || !/^[\w.+-]+$/.test(pkg)) {
      console.warn(
        `[winsetup] ID de winget sospechoso en ${id}.txt: "${pkg}"`,
      );
    }
  }
  return packages;
}

const metadata = [
  {
    id: "default",
    name: "Default",
    description: {
      es: "Todo: navegadores, desarrollo, multimedia, ofimática, utilidades y gaming.",
      en: "Everything: browsers, dev, media, office, utilities and gaming.",
    },
  },
  {
    id: "gaming",
    name: "Gaming",
    description: {
      es: "Steam, Discord, Epic, LoL EUW y OBS.",
      en: "Steam, Discord, Epic, LoL EUW and OBS.",
    },
  },
  {
    id: "dev",
    name: "Dev",
    description: {
      es: "Herramientas de desarrollo: Git, VS Code, Node, Python, Docker.",
      en: "Development tools: Git, VS Code, Node, Python, Docker.",
    },
  },
  {
    id: "media",
    name: "Media",
    description: {
      es: "Reproductores y edición: VLC, Spotify, AIMP, HandBrake y Audacity.",
      en: "Players and editing: VLC, Spotify, AIMP, HandBrake and Audacity.",
    },
  },
  {
    id: "general",
    name: "General",
    description: {
      es: "Uso general: navegadores, ofimática, descargas, utilidades y creatividad.",
      en: "General use: browsers, office, downloads, utilities and creativity.",
    },
  },
];

export const lists = metadata.map((list) => ({
  ...list,
  script: `${list.id}.ps1`,
  packages: readPackages(list.id),
}));

export function commandFor(list) {
  return `iwr ${BASE}/${list.script} -UseBasicParsing | iex`;
}
