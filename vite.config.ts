import { defineConfig } from "vite-plus";

const isCI = Boolean(process.env["CI"]);

const GENERATED = [
  "coverage/**",
  "dist/**",
  "playwright-report/**",
  "test-results/**",
  "src/wheels/**",
];

const LINT_PLUGINS = [
  "eslint",
  "typescript",
  "unicorn",
  "oxc",
  "import",
  "jsdoc",
  "promise",
  "node",
  "vitest",
] as const;

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
  build: {
    rolldownOptions: {
      input: { main: "index.html", privacy: "privacy/index.html" },
      output: { assetFileNames },
    },
  },
  worker: { format: "es", rolldownOptions: { output: { assetFileNames } } },
  run: {
    tasks: {
      check: {
        command: "vp check --deny-warnings",
        cache: false,
      },
      typecheck: {
        command: "vp check --no-fmt --no-lint",
        cache: false,
      },
      test: {
        command: "vp test --run --coverage",
        cache: false,
      },
      qa: {
        command: ["vp run check", "vp run typecheck", "vp run test"],
        cache: false,
      },
    },
  },
  test: {
    reporters: isCI ? ["dot", "github-actions"] : ["default"],
    // Undo `vi.spyOn` and module mocks before each test so they cannot leak.
    restoreMocks: true,
    unstubGlobals: true,
    // Shuffle files and tests on every run so order dependencies surface.
    sequence: { shuffle: true },
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "html", "json"],
      include: ["src/storage.ts"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  fmt: {
    ignorePatterns: [...GENERATED, "pnpm-lock.yaml", "skills-lock.json"],
  },
  lint: {
    plugins: [...LINT_PLUGINS],
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "error",
    },
    env: {
      browser: true,
      node: true,
      builtin: true,
    },
    ignorePatterns: GENERATED,
    options: {
      typeAware: true,
      typeCheck: true,
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(vite|vitest|@vitest/[^/]+)(/|$)",
              message: "Import from the matching vite-plus entry point.",
            },
          ],
        },
      ],

      // Security: block XSS and code injection through escape hatches.
      "no-restricted-properties": [
        "error",
        { property: "outerHTML" },
        { property: "insertAdjacentHTML" },
        { property: "createContextualFragment" },
        { property: "setHTMLUnsafe" },
        { object: "document", property: "write" },
        { object: "document", property: "writeln" },
      ],
      "import/no-dynamic-require": ["error", { esmodule: true }],
      "no-eval": "error",
      "no-new-func": "error",
      "typescript/no-implied-eval": "error",

      // Match the conventions the codebase already follows.
      "capitalized-comments": [
        "error",
        "always",
        { ignoreConsecutiveComments: true, ignorePattern: "[cv]8|istanbul|iOS" },
      ],
      "one-var": ["error", "never"],
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "require-await": "off",
      "typescript/require-await": "error",
      "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
      "no-void": ["error", { allowAsStatement: true }],
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      "import/no-named-as-default": "off",

      // Web Worker postMessage has no targetOrigin parameter.
      "unicorn/require-post-message-target-origin": "off",

      // TypeScript idioms in DOM and third-party libraries.
      "typescript/no-unnecessary-type-parameters": "off",
      "typescript/no-unsafe-type-assertion": "off",

      // Dedicated tools.
      "sort-imports": "off",
      "unicorn/filename-case": "off",
      "vitest/require-hook": "off",
    },
    overrides: [
      {
        files: ["tests/**/*.test.ts"],
        rules: {
          "vitest/consistent-test-it": ["error", { fn: "test" }],
          "vitest/require-hook": "error",
          "vitest/prefer-called-times": "off",
          "vitest/prefer-to-be-truthy": "off",
          "vitest/prefer-to-be-falsy": "off",
          "vitest/valid-title": ["error", { allowArguments: true }],
          "vitest/no-importing-vitest-globals": "off",
          "vitest/no-hooks": "off",
          "vitest/require-top-level-describe": "off",
          "vitest/require-test-timeout": "off",
          "vitest/prefer-expect-assertions": "off",
          "unicorn/no-useless-promise-resolve-reject": "off",
        },
      },
      {
        files: ["tests/**/*.spec.ts"],
        rules: {
          "vitest/prefer-importing-vitest-globals": "off",
          "vitest/consistent-test-filename": "off",
          "vitest/prefer-each": "off",
          "vitest/require-hook": "off",
          "vitest/no-standalone-expect": "off",
          "vitest/expect-expect": "off",
          "vitest/no-conditional-in-test": "off",
          "no-await-in-loop": "off",
          "unicorn/prefer-dom-node-text-content": "off",
          "unicorn/consistent-function-scoping": "off",
        },
      },
      {
        files: ["*.config.{ts,mjs}", "scripts/**", "tests/**"],
        rules: {
          "node/no-top-level-await": "off",
          "node/no-process-env": "off",
          "import/no-nodejs-modules": "off",
          "no-console": "off",
        },
      },
      {
        files: ["**/*.{js,mjs,cjs}"],
        rules: {
          "typescript/strict-boolean-expressions": "off",
          "typescript/no-unsafe-argument": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-call": "off",
          "typescript/no-unsafe-member-access": "off",
          "typescript/no-unsafe-return": "off",
        },
      },
      {
        files: ["vite.config.ts"],
        rules: {
          "max-lines": "off",
        },
      },
    ],
  },
});
