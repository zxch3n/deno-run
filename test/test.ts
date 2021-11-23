import * as path from "https://deno.land/std@0.105.0/path/mod.ts";

export function getDirName(meta: ImportMeta) {
  const iURL = meta.url,
    fileStartRegex = /(^(file:)((\/\/)?))/,
    __dirname = path
      .join(iURL, "../")
      .replace(fileStartRegex, "")
      .replace(/(\/$)/, ""),
    __filename = iURL.replace(fileStartRegex, "");

  return { __dirname, __filename };
}

const __dirname = getDirName(import.meta).__dirname;

Deno.test({
  name: "test net permission",
  fn: async () => {
    // deno run -A deno-run.ts ./test/example.net.ts
    const child = Deno.run({
      cmd: [
        "deno",
        "run",
        "-A",
        path.resolve(__dirname, "..", "deno-run.ts"),
        path.resolve(__dirname, "example.net.ts"),
      ],
      stderr: "piped",
    });
    const code = await child.status();
    const errorString = new TextDecoder().decode(await child.stderrOutput());
    child.close();

    if (errorString) {
      console.error(errorString);
      throw new Error();
    }
  },
});
