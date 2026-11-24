// Runs the md2linkedin Python package in Pyodide, off the main thread so the
// editor stays responsive while CPython downloads and compiles.
import { loadPyodide, version } from "pyodide";
import type { ConvertRequest, ConvertResponse } from "./protocol.ts";

// The wheels scripts/build-wheels.sh cross-compiled for this Pyodide release.
const wheels = Object.values(
  import.meta.glob<string>("./wheels/*.whl", {
    query: "?url",
    import: "default",
    eager: true,
  }),
);

const convert = (async () => {
  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
  });
  await pyodide.loadPackage(
    wheels.map((url) => new URL(url, location.href).href),
  );
  return pyodide.pyimport("md2linkedin").convert;
})();

self.addEventListener(
  "message",
  async ({ data }: MessageEvent<ConvertRequest>) => {
    let response: ConvertResponse;
    try {
      const text: string = (await convert).callKwargs(data.markdown, {
        preserve_links: data.preserveLinks,
        monospace_code: data.monospaceCode,
      });
      response = { id: data.id, text };
    } catch (error) {
      response = { id: data.id, error: String(error) };
    }
    self.postMessage(response);
  },
);
