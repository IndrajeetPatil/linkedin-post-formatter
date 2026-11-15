import { defineConfig } from "vite-plus";

// Wheels keep their exact file names, which Pyodide parses for the package
// name and platform; the versions in those names already bust caches.
const assetFileNames = ({ names }: { names: string[] }) =>
  names[0]?.endsWith(".whl") ? "wheels/[name][extname]" : "assets/[name]-[hash][extname]";

export default defineConfig({
  // GitHub Pages serves a project site from /<repository>/.
  base: process.env["PAGES_BASE"] ?? "/",
  assetsInclude: ["**/*.whl"],
  // Pyodide locates its runtime files itself, so it is left unbundled in dev.
  optimizeDeps: { exclude: ["pyodide"] },
  build: { rolldownOptions: { output: { assetFileNames } } },
  worker: { format: "es", rolldownOptions: { output: { assetFileNames } } },
  fmt: { ignorePatterns: ["src/wheels/**"] },
  lint: {
    ignorePatterns: ["src/wheels/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
