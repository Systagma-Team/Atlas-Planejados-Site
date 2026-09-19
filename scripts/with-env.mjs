// Executa um comando com as variáveis de um arquivo de ambiente (ex.: .env.supabase), sem depender de --env-file
// (o Next repassa flags do Node aos processos de build e recusa essa).
//   node scripts/with-env.mjs .env.supabase -- node node_modules/next/dist/bin/next build
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const [envFile, sep, cmd, ...args] = process.argv.slice(2);
if (!envFile || sep !== "--" || !cmd) {
  console.error("Uso: node scripts/with-env.mjs <arquivo.env> -- <comando> [args]");
  process.exit(2);
}

let vars;
try {
  vars = parseEnv(readFileSync(envFile, "utf8"));
} catch (e) {
  console.error(`Não consegui ler ${envFile}: ${e.message}`);
  process.exit(2);
}

const child = spawn(cmd, args, { stdio: "inherit", env: { ...process.env, ...vars }, shell: false });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
