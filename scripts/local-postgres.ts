/**
 * Postgres local para desenvolvimento e testes — sem Docker e sem tocar no Supabase.
 *   npm run db:local          (deixe rodando em um terminal)
 * Dados em data/pg. URL: postgresql://postgres:postgres@localhost:54329/atlas
 */
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const dir = path.resolve(process.cwd(), "data/pg");
const port = Number(process.env.LOCAL_PG_PORT || 54329);
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port, persistent: true });

async function main() {
  if (!fs.existsSync(path.join(dir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase("atlas");
  } catch {
    // já existe
  }
  console.log(`Postgres local pronto em postgresql://postgres:postgres@localhost:${port}/atlas  (Ctrl+C para parar)`);

  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
