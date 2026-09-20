/**
 * Pós-processamento da pasta out/.
 *
 * Ao navegar entre páginas, o Next pede arquivos de pré-carregamento com o caminho "achatado" por pontos, como
 * /projetos/__next.projetos.categoria.$d$slug.__PAGE__.txt. Dependendo do sistema onde o build roda, ele grava esses
 * arquivos em subpastas (__next.projetos/categoria/$d$slug/__PAGE__.txt), e a hospedagem estática responde 404.
 * Aqui criamos também a versão com pontos, para que qualquer hospedagem (e qualquer sistema de build) funcione.
 * Se o Next já tiver gravado no formato certo, não há nada a fazer.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  let created = 0;
  const dirs: string[] = [];
  async function find(dir: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name.startsWith("__next.")) dirs.push(full);
      else if (entry.name !== "_next" && entry.name !== "media") await find(full);
    }
  }
  await find(OUT);

  for (const dir of dirs) {
    const parent = path.dirname(dir);
    const base = path.basename(dir);
    for await (const file of walk(dir)) {
      const flat = `${base}.${path.relative(dir, file).split(path.sep).join(".")}`;
      await fs.copyFile(file, path.join(parent, flat));
      created++;
    }
  }
  if (created) console.log(`✓ Pós-build: ${created} arquivo(s) de pré-carregamento com nome achatado criado(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
