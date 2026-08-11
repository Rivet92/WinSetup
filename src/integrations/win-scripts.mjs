import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "scripts");
const PACKAGELISTS = join(SOURCE, "packagelists");
const TEMPLATE = join(SOURCE, "template.ps1");

// Sirve en la raiz del sitio los scripts y listas reales:
//  - packagelists/*.txt se copian tal cual.
//  - Los *.ps1 se GENERAN desde scripts/template.ps1 (placeholder
//    {{LIST_NAME}}), uno por lista, para no duplicar el mismo script.
// Antes limpia las copias previas para no servir ficheros obsoletos.
export default function winScripts() {
  return {
    name: "winsetup-scripts",
    hooks: {
      "astro:config:done": ({ config }) => {
        if (!existsSync(PACKAGELISTS) || !existsSync(TEMPLATE)) return;
        const dest = fileURLToPath(config.publicDir);

        // Limpiar generados previos.
        rmSync(join(dest, "packagelists"), { recursive: true, force: true });
        for (const entry of readdirSync(dest)) {
          if (entry.endsWith(".ps1")) rmSync(join(dest, entry), { force: true });
        }

        // Copiar las listas.
        cpSync(PACKAGELISTS, join(dest, "packagelists"), { recursive: true });

        // Generar un script por lista a partir de la plantilla.
        const template = readFileSync(TEMPLATE, "utf8");
        for (const file of readdirSync(PACKAGELISTS)) {
          if (!file.endsWith(".txt")) continue;
          const name = file.slice(0, -4);
          const script = template.replaceAll("{{LIST_NAME}}", name);
          writeFileSync(join(dest, `${name}.ps1`), script);
        }
      },
    },
  };
}
