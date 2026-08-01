import { build } from "esbuild";

const outdir = "../src/materialx_bookmarks/assets";

await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "iife",
  minify: true,
  target: ["es2020"],
  outfile: `${outdir}/bookmarks.js`,
});

await build({
  entryPoints: ["src/styles.css"],
  bundle: true,
  minify: true,
  outfile: `${outdir}/bookmarks.css`,
});
