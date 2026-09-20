/**
 * Lê a pasta conteudo/, confere tudo com mensagens em português e gera:
 *   - public/media/<chave>/<largura>.webp   fotos otimizadas (WebP em várias larguras)
 *   - src/generated/conteudo.json           dados que o site usa na hora de montar as páginas
 * Roda sozinho antes de `npm run dev` e `npm run build`. Para rodar à mão: `npm run conteudo`.
 * As fotos já processadas ficam em cache (.cache/): só o que mudou é reprocessado.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { IMAGE_WIDTHS, variantWidths } from "../src/lib/media";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "conteudo");
const MEDIA_OUT = path.join(ROOT, "public", "media");
const CACHE = path.join(ROOT, ".cache", "media");
const GENERATED = path.join(ROOT, "src", "generated", "conteudo.json");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff"]);

const errors: string[] = [];
const warnings: string[] = [];
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------- Esquemas (os nomes dos campos são os que aparecem nos arquivos .json) ----------
const text = (max: number) => z.string().trim().max(max);
const paragraphs = z
  .union([text(6000), z.array(text(3000))])
  .transform((v) => (Array.isArray(v) ? v : v.split(/\n{2,}/)).map((p) => p.trim()).filter(Boolean));
const digits = (v: string) => v.replace(/\D/g, "");
const phone = text(30).refine((v) => v === "" || (digits(v).length >= 10 && digits(v).length <= 13), "informe o número com DDD. Ex.: +55 84 91234-5678");
const linkFrom = (hosts: string[], hint: string) => text(300).refine((v) => v === "" || hosts.some((h) => v.startsWith(h)), hint);

const siteSchema = z.strictObject({
  urlDoSite: text(200).refine((v) => v === "" || /^https?:\/\//.test(v), "comece com https://"),
  whatsapp: phone,
  whatsapp2: phone,
  telefone: text(30),
  email: text(120).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "e-mail inválido"),
  instagram: linkFrom(["https://www.instagram.com/", "https://instagram.com/"], "cole o endereço completo do perfil. Ex.: https://www.instagram.com/atlasplanejados"),
  facebook: linkFrom(["https://www.facebook.com/", "https://facebook.com/", "https://fb.com/"], "cole o endereço completo da página"),
  endereco: text(300),
  horarioDeAtendimento: text(200),
  mapaGoogle: linkFrom(["https://www.google.com/maps/embed"], 'use o link de "Incorporar um mapa" do Google Maps (começa com https://www.google.com/maps/embed)'),
  textoSobre: paragraphs,
});

const categoriesSchema = z.array(
  z.strictObject({
    slug: text(60).regex(SLUG, "use só letras minúsculas, números e hífens. Ex.: guarda-roupas"),
    nome: text(80).min(2),
    descricao: text(300).default(""),
    ativa: z.boolean().default(true),
  }),
);

const photoSchema = z.strictObject({
  tratada: text(200).min(1, "informe o nome do arquivo da foto"),
  original: text(200).optional(),
  alt: text(300).min(5, "descreva a foto em uma frase (texto alternativo, usado por leitores de tela e pelo Google)"),
});

const projectSchema = z.strictObject({
  titulo: text(120).min(3),
  categoria: text(60),
  descricao: text(400).default(""),
  detalhes: paragraphs.default([]),
  destaque: z.boolean().default(false),
  publicado: z.boolean().default(true),
  ano: z.number().int().min(1950).max(2100).nullable().default(null),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use o formato AAAA-MM-DD. Ex.: 2026-09-20"),
  fotos: z.array(photoSchema),
});

// ---------- Utilidades ----------
function report(file: string, error: z.ZodError) {
  for (const issue of error.issues) {
    const where = issue.path.length ? `campo "${issue.path.join(" › ")}"` : "arquivo";
    if (issue.code === "unrecognized_keys") {
      errors.push(`${file}: campo(s) desconhecido(s): ${issue.keys.join(", ")} (erro de digitação? confira os nomes no README).`);
      continue;
    }
    errors.push(`${file}: ${where}: ${issue.message}`);
  }
}

async function readJson(file: string): Promise<unknown | undefined> {
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    errors.push(`${rel(file)}: arquivo não encontrado.`);
    return undefined;
  }
  try {
    return JSON.parse(raw.replace(/^﻿/, ""));
  } catch (e) {
    errors.push(`${rel(file)}: JSON inválido (${(e as Error).message}). Confira vírgulas e aspas.`);
    return undefined;
  }
}

const exists = (p: string) => fs.access(p).then(() => true, () => false);

type Processed = { fileKey: string; width: number; height: number; blurDataUrl: string };
const processing = new Map<string, Promise<Processed>>();

/** Gera as versões otimizadas de uma foto (ou reaproveita o cache). A chave vem do conteúdo do arquivo. */
function processImage(file: string): Promise<Processed> {
  let job = processing.get(file);
  if (!job) {
    job = (async () => {
      const input = await fs.readFile(file);
      const fileKey = createHash("sha256").update(input).digest("hex").slice(0, 24);
      const cacheFile = path.join(CACHE, `${fileKey}.json`);
      const outDir = path.join(MEDIA_OUT, fileKey);

      try {
        const cached = JSON.parse(await fs.readFile(cacheFile, "utf8")) as Processed;
        const complete = (await Promise.all(variantWidths(cached.width).map((w) => exists(path.join(outDir, `${w}.webp`))))).every(Boolean);
        if (complete) return cached;
      } catch {}

      const oriented = await sharp(input, { limitInputPixels: 80_000_000 }).rotate().toBuffer({ resolveWithObject: true });
      const maxWidth = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
      const width = Math.min(oriented.info.width, maxWidth);
      const height = Math.round((oriented.info.height * width) / oriented.info.width);

      await fs.mkdir(outDir, { recursive: true });
      await Promise.all(
        variantWidths(width).map(async (w) => {
          const data = await sharp(oriented.data)
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: w >= 1600 ? 80 : 78, effort: 4 })
            .toBuffer();
          await fs.writeFile(path.join(outDir, `${w}.webp`), data);
        }),
      );
      const blur = await sharp(oriented.data).resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();
      const result: Processed = { fileKey, width, height, blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}` };
      await fs.mkdir(CACHE, { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(result));
      return result;
    })();
    processing.set(file, job);
  }
  return job;
}

async function checkPhotoFile(dir: string, name: string, label: string) {
  if (name !== path.basename(name)) {
    errors.push(`${rel(dir)}/projeto.json: ${label} "${name}": use só o nome do arquivo, sem pastas.`);
    return null;
  }
  const file = path.join(dir, name);
  if (!IMAGE_EXT.has(path.extname(name).toLowerCase())) {
    errors.push(`${rel(dir)}/projeto.json: ${label} "${name}": formato não suportado (use JPG, PNG ou WebP).`);
    return null;
  }
  if (!(await exists(file))) {
    errors.push(`${rel(dir)}/projeto.json: ${label} "${name}": arquivo não encontrado na pasta do projeto.`);
    return null;
  }
  return file;
}

// ---------- Principal ----------
async function main() {
  if (process.argv.includes("--limpar")) {
    await fs.rm(MEDIA_OUT, { recursive: true, force: true });
    await fs.rm(path.join(ROOT, ".cache"), { recursive: true, force: true });
    console.log("Cache de fotos apagado.");
  }
  const started = Date.now();

  // Site
  let settings: z.infer<typeof siteSchema> | undefined;
  const siteRaw = await readJson(path.join(CONTENT, "site.json"));
  if (siteRaw !== undefined) {
    const r = siteSchema.safeParse(siteRaw);
    if (r.success) settings = r.data;
    else report("conteudo/site.json", r.error);
  }

  // Categorias
  let categories: z.infer<typeof categoriesSchema> = [];
  const catRaw = await readJson(path.join(CONTENT, "categorias.json"));
  if (catRaw !== undefined) {
    const r = categoriesSchema.safeParse(catRaw);
    if (r.success) categories = r.data;
    else report("conteudo/categorias.json", r.error);
  }
  const seenCat = new Set<string>();
  for (const c of categories) {
    if (seenCat.has(c.slug)) errors.push(`conteudo/categorias.json: categoria "${c.slug}" repetida.`);
    seenCat.add(c.slug);
  }

  // Projetos
  const projectsDir = path.join(CONTENT, "projetos");
  const folders = (await fs.readdir(projectsDir, { withFileTypes: true }).catch(() => []))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const projects: unknown[] = [];
  const usedKeys = new Set<string>();

  for (const slug of folders) {
    const dir = path.join(projectsDir, slug);
    if (!SLUG.test(slug)) {
      errors.push(`conteudo/projetos/${slug}: nome de pasta inválido (use só letras minúsculas, números e hífens; ele vira o endereço da página).`);
      continue;
    }
    const raw = await readJson(path.join(dir, "projeto.json"));
    if (raw === undefined) continue;
    const parsed = projectSchema.safeParse(raw);
    if (!parsed.success) {
      report(`${rel(dir)}/projeto.json`, parsed.error);
      continue;
    }
    const p = parsed.data;
    if (!seenCat.has(p.categoria)) {
      errors.push(`${rel(dir)}/projeto.json: campo "categoria": "${p.categoria}" não existe em conteudo/categorias.json (existem: ${[...seenCat].join(", ") || "nenhuma"}).`);
      continue;
    }
    if (p.publicado && p.fotos.length === 0) warnings.push(`${rel(dir)}: projeto publicado sem fotos — ele não aparecerá no site até ganhar ao menos uma foto.`);

    const images = [];
    let broken = false;
    for (const [i, foto] of p.fotos.entries()) {
      const treatedFile = await checkPhotoFile(dir, foto.tratada, `foto ${i + 1}`);
      const originalFile = foto.original ? await checkPhotoFile(dir, foto.original, `foto ${i + 1} (original)`) : null;
      if (!treatedFile || (foto.original && !originalFile)) {
        broken = true;
        continue;
      }
      try {
        const treated = await processImage(treatedFile);
        usedKeys.add(treated.fileKey);
        let original: Processed | null = null;
        if (originalFile) {
          original = await processImage(originalFile);
          usedKeys.add(original.fileKey);
        }
        images.push({ ...treated, alt: foto.alt, original });
      } catch (e) {
        broken = true;
        errors.push(`${rel(dir)}: não foi possível ler a foto "${foto.tratada}" ou a original (${(e as Error).message}).`);
      }
    }
    if (broken) continue;

    projects.push({
      slug,
      title: p.titulo,
      category: p.categoria,
      description: p.descricao,
      details: p.detalhes,
      featured: p.destaque,
      published: p.publicado,
      year: p.ano,
      date: p.data,
      images,
    });
  }

  if (errors.length) {
    console.error(`\n✗ Encontramos ${errors.length} problema(s) no conteúdo:\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error("\nCorrija e rode novamente.\n");
    process.exit(1);
  }

  // Remove fotos otimizadas que não são mais usadas.
  for (const d of await fs.readdir(MEDIA_OUT).catch(() => [] as string[])) {
    if (!usedKeys.has(d)) await fs.rm(path.join(MEDIA_OUT, d), { recursive: true, force: true });
  }

  await fs.mkdir(path.dirname(GENERATED), { recursive: true });
  const next = JSON.stringify({ settings, categories, projects });
  // Só regrava se mudou (evita recarregar o servidor de desenvolvimento à toa).
  if ((await fs.readFile(GENERATED, "utf8").catch(() => "")) !== next) await fs.writeFile(GENERATED, next);

  if (settings && !settings.urlDoSite && !process.env.SITE_URL) warnings.push('conteudo/site.json: "urlDoSite" está vazio — preencha com o endereço final do site (ex.: https://www.atlasplanejados.com.br) antes de publicar, para o Google e o compartilhamento usarem o endereço certo.');
  for (const w of warnings) console.warn(`! ${w}`);
  const visible = (projects as { published: boolean }[]).filter((p) => p.published).length;
  console.log(
    `✓ Conteúdo pronto: ${projects.length} projeto(s) (${visible} publicado(s)), ${categories.length} categoria(s), ${usedKeys.size} foto(s) otimizada(s) em ${((Date.now() - started) / 1000).toFixed(1)}s.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
