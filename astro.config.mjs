import { defineConfig } from "astro/config";
import winScripts from "./src/integrations/win-scripts.mjs";

export default defineConfig({
  site: "https://winsetup.jlerga.dev",
  output: "static",
  integrations: [winScripts()],
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Minificador esbuild: lightningcss rechaza un selector de XP.css
  // (pseudo-elemento seguido de atributo) y romperia el build.
  vite: {
    build: {
      cssMinify: "esbuild",
    },
  },
});
