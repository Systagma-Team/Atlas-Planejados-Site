/**
 * Cria a pasta de um novo projeto já com o projeto.json preenchido.
 *
 *   npm run novo:projeto -- "Cozinha em U azul" cozinhas
 *
 * O segundo argumento é a categoria (o "slug" de conteudo/categorias.json). Depois é só colocar as fotos na pasta
 * criada e preencher a lista "fotos" do projeto.json.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { slugify } from "../src/lib/slug";

async function main() {
  const [title, category] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const categories = JSON.parse(await fs.readFile("conteudo/categorias.json", "utf8")) as { slug: string; nome: string }[];
  const valid = categories.map((c) => c.slug);

  if (!title || !category) {
    console.error('Uso: npm run novo:projeto -- "Título do projeto" <categoria>');
    console.error(`Categorias disponíveis: ${valid.join(", ")}`);
    process.exit(1);
  }
  if (!valid.includes(category)) {
    console.error(`Categoria "${category}" não existe. Use uma destas: ${valid.join(", ")}`);
    process.exit(1);
  }

  const slug = slugify(title);
  const dir = path.join("conteudo", "projetos", slug);
  try {
    await fs.access(dir);
    console.error(`A pasta ${dir} já existe.`);
    process.exit(1);
  } catch {}

  await fs.mkdir(dir, { recursive: true });
  const project = {
    titulo: title,
    categoria: category,
    descricao: "Uma ou duas frases sobre o projeto (aparece nos cartões e no Google).",
    destaque: false,
    publicado: false,
    data: new Date().toISOString().slice(0, 10),
    fotos: [],
  };
  await fs.writeFile(path.join(dir, "projeto.json"), JSON.stringify(project, null, 2) + "\n");

  console.log(`✓ Projeto criado em ${dir}/`);
  console.log("  1. Coloque as fotos nessa pasta e liste cada uma em \"fotos\" (a primeira é a capa), assim:");
  console.log('       { "tratada": "foto-1.png", "original": "foto-1-original.jpg", "alt": "Descreva a foto em uma frase" }');
  console.log('     ("original" é opcional: é a foto sem tratamento que o visitante pode escolher ver.)');
  console.log('  2. Ajuste "descricao" e troque "publicado" para true quando estiver pronto.');
  console.log("  3. Rode npm run dev para ver o resultado.");
}

main();
