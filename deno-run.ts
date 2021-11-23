import { parse } from "https://deno.land/std@0.115.1/flags/mod.ts";
import { existsSync } from "https://deno.land/std@0.115.1/fs/mod.ts";

async function main() {
  const args = parse(Deno.args, { boolean: ["f"] });
  const targetFile = args._[0] as string;

  if (!existsSync(targetFile) || !Deno.statSync(targetFile).isFile) {
    throw new Error(`Expecting "${targetFile}" to be a file`);
  }

  const permissions = await getFilePermission(targetFile);
  await run(targetFile, permissions ?? []);
}

async function getFilePermission(file: string) {
  let content = await Deno.readTextFile(file);
  content = content.trimLeft();
  if (!content.match(/^\/\*/)) {
    return;
  }

  const end = /\*\//.exec(content);
  if (end == null) {
    return;
  }
  const endIndex = end.index + end[0].length;
  content = content.slice(0, endIndex);
  const permissions = /@permission (.*)/.exec(content)?.[1];
  if (!permissions) {
    return;
  }

  return permissions.split(" ").filter(Boolean);
}

const PERMISSIONS = [
  "--allow-hrtime",
  "--allow-net",
  "--allow-ffi",
  "--unstable",
  "--allow-read",
  "--allow-run",
  "--allow-write",
  "--allow-env",
];
async function run(file: string, permission: string[]) {
  console.log(`deno run ${file} ${permission.join(" ")}`);
  while (true) {
    const child = Deno.run({
      cmd: ["deno", "run", ...permission, file],
      stderr: "piped",
    });
    await child.status();
    const errorString = new TextDecoder().decode(await child.stderrOutput());
    if (errorString) {
      for (const forbiddenPermission of PERMISSIONS) {
        if (errorString.includes(forbiddenPermission)) {
          const ans = prompt(
            `❎Require '${forbiddenPermission}'. Add it?[y/N]`
          );
          if (ans?.toLowerCase() !== "y") {
            throw errorString;
          }

          permission.push(forbiddenPermission);
        }
      }
    } else {
      break;
    }
  }
}

main();
