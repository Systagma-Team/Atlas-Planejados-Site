/**
 * Carga inicial. Idempotente: só cria o portfólio de exemplo se o banco estiver vazio
 * (nenhuma categoria e nenhum projeto) e só cria o administrador se ainda não existir nenhum.
 *
 * O portfólio inicial usa os PARES fornecidos pela Atlas, com o mesmo nome nas duas pastas:
 *   src/projetos/tratados/<categoria>/<nome>.png   → imagem tratada (a que o site mostra por padrão)
 *   src/projetos/originais/<categoria>/<nome>.<ext> → foto original (o visitante escolhe vê-la)
 * Cada arquivo passa pelo mesmo pipeline de otimização do painel (WebP em várias larguras). Títulos, resumos e
 * textos alternativos descrevem apenas o que aparece nas imagens e podem ser editados no painel.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { storeImage } from "../src/server/images/storage";
import { slugify } from "../src/lib/slug";

try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch {}

const db = new PrismaClient();
const TREATED = path.resolve(process.cwd(), "src/projetos/tratados");
const ORIGINALS = path.resolve(process.cwd(), "src/projetos/originais");

type SeedImage = { slug: string; alt: string }; // slug = nome do par tratada/original
type SeedProject = {
  folder: string; // pasta em src/projetos/tratados/
  category: string;
  title: string;
  description: string;
  featured: boolean;
  images: SeedImage[]; // a primeira é a capa
};

const categories = [
  { name: "Cozinhas", description: "Cozinhas planejadas sob medida." },
  { name: "Guarda-roupas", description: "Guarda-roupas e closets planejados sob medida." },
  { name: "Lojas", description: "Mobiliário planejado para lojas e espaços comerciais." },
  { name: "Balcões de caixa", description: "Balcões de atendimento e de caixa." },
];

// A ordem desta lista define o "mais recente primeiro" e, portanto, quais projetos aparecem nos destaques da Home
// (o primeiro destaque é a foto principal do hero).
const projects: SeedProject[] = [
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em verde-sálvia com detalhes amadeirados",
    description: "Armários aéreos em verde-sálvia com bordas amadeiradas, nicho aberto e bancada com gavetas.",
    featured: true,
    images: [{ slug: "cozinha-verde-salvia", alt: "Cozinha com armários aéreos verde-sálvia com bordas amadeiradas, nicho aberto e bancada em L com gavetas" }],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Guarda-roupa com espelho iluminado",
    description: "Guarda-roupa com portas em tom rosado, armários superiores brancos e nicho lateral com espelho e gavetas.",
    featured: true,
    images: [
      { slug: "guarda-roupa-espelho-aceso", alt: "Guarda-roupa com portas rosadas, armários superiores brancos, espelho oval iluminado e gavetas com puxadores dourados" },
      { slug: "guarda-roupa-espelho-apagado", alt: "O mesmo guarda-roupa com a iluminação do espelho apagada" },
    ],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em U com armários em cinza",
    description: "Cozinha planejada em U, armários cinza com puxadores embutidos e nicho para adega.",
    featured: true,
    images: [
      { slug: "cozinha-u-cinza-frente", alt: "Cozinha em U vista de frente, com armários cinza, bancada de pedra e janela de madeira ao centro" },
      { slug: "cozinha-u-cinza-peninsula", alt: "Cozinha em U com península de bancada de pedra e painel de madeira, armários cinza e geladeira inox" },
    ],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Closet aberto em L com sapateira e gavetas",
    description: "Closet em L com sapateira, cabideiro, nichos e gavetas com puxadores dourados.",
    featured: true,
    images: [{ slug: "closet-aberto-em-l", alt: "Closet aberto em L com sapateira, cabideiro, nichos e gavetas com puxadores dourados" }],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Loja equipada com nichos, araras e painel expositor",
    description: "Conjunto de mobiliário para loja: módulos de nichos com arara, prateleiras de parede e painel canaletado.",
    featured: true,
    images: [
      { slug: "loja-modulos-e-balcao", alt: "Loja com módulo de nichos e arara ao fundo, prateleiras de parede e balcão branco à direita" },
      { slug: "loja-gavetas-porta-de-vidro", alt: "Loja com módulo de gavetas e prateleiras diante de uma grande porta de vidro" },
      { slug: "loja-prateleiras-de-parede", alt: "Prateleiras brancas de parede instaladas ao lado da porta de vidro da loja" },
      { slug: "loja-painel-canaletado", alt: "Painel canaletado branco fixado na parede para exposição de produtos" },
    ],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em tons claros com nicho amadeirado",
    description: "Armários claros com nichos em madeira, integrados à geladeira e à bancada de trabalho.",
    featured: true,
    images: [{ slug: "cozinha-tons-claros", alt: "Cozinha com armários em tom claro, nichos amadeirados, micro-ondas embutido e geladeira inox" }],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Guarda-roupa branco com nichos e gavetas",
    description: "Guarda-roupa branco com cabideiro, nichos de vários tamanhos e gavetas centrais.",
    featured: false,
    images: [{ slug: "guarda-roupa-branco-nichos-gavetas", alt: "Guarda-roupa branco com portas abertas mostrando nichos, cabideiro e gavetas, ao lado de uma porta de madeira" }],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Módulo de closet em L com gavetas",
    description: "Módulo de closet em L com prateleiras, cabideiro e gavetas com frentes escuras.",
    featured: false,
    images: [{ slug: "closet-modulo-em-l", alt: "Módulo de closet branco em L com prateleiras, cabideiro e gavetas de frente escura" }],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Guarda-roupa aberto com nichos e cabideiro",
    description: "Guarda-roupa branco com nichos de vários tamanhos e cabideiro central.",
    featured: false,
    images: [{ slug: "guarda-roupa-aberto-nichos-cabideiro", alt: "Guarda-roupa branco aberto com nichos de vários tamanhos e cabideiro central" }],
  },
  {
    folder: "guarda-roupas",
    category: "Guarda-roupas",
    title: "Módulo de nichos com borda escura",
    description: "Módulo alto de nichos brancos com acabamento de borda escura, sobre rodízios.",
    featured: false,
    images: [{ slug: "modulo-nichos-borda-escura", alt: "Módulo alto de nichos brancos com borda escura, sobre rodízios" }],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Arara com gavetas e nichos",
    description: "Módulos brancos com barra para cabides, gavetas com cava e nichos inferiores.",
    featured: false,
    images: [
      { slug: "arara-gavetas-frente", alt: "Módulo branco com barra para cabides e duas gavetas na base" },
      { slug: "arara-gavetas-oficina", alt: "Módulo branco com barra para cabides e duas gavetas com cava, em outro ângulo" },
      { slug: "arara-nichos-base", alt: "Módulo branco alto com barra para cabides e seis nichos na parte inferior" },
    ],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em cinza brilhante com tampo preto",
    description: "Módulos em acabamento cinza brilhante com tampo escuro e cooktop embutido.",
    featured: false,
    images: [{ slug: "cozinha-cinza-brilhante", alt: "Cozinha em L com armários cinza brilhante e tampo preto com cooktop" }],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha branca com puxadores dourados",
    description: "Armários brancos com gavetas de detalhe escuro, puxadores dourados e tampo preto.",
    featured: false,
    images: [{ slug: "cozinha-branca-puxadores-dourados", alt: "Cozinha com armários brancos, gavetas com detalhe escuro, puxadores dourados e tampo preto" }],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Estantes de nichos",
    description: "Estantes brancas com nichos de diferentes tamanhos, para exposição e organização.",
    featured: false,
    images: [
      { slug: "estante-nichos-cabideiro", alt: "Estante branca com nichos e barra para cabides ao centro" },
      { slug: "estante-nichos-ampla", alt: "Estante ampla de nichos com prateleiras em alturas variadas" },
      { slug: "estante-nichos-coluna", alt: "Coluna alta de nichos brancos em duas colunas" },
      { slug: "estante-nichos-borda-escura", alt: "Módulo de nichos com borda escura, sobre rodízios" },
      { slug: "estante-prateleiras-e-nichos", alt: "Estante alta de prateleiras ao lado de um módulo de nichos com gavetas" },
    ],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Torres expositoras",
    description: "Duas torres brancas com prateleiras escalonadas, ideais para exposição de pequenos produtos.",
    featured: false,
    images: [{ slug: "torres-expositoras", alt: "Duas torres brancas com prateleiras escalonadas" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão de atendimento com gavetas e nicho",
    description: "Balcão branco com tampo elevado, gavetas com chave e nichos de apoio.",
    featured: false,
    images: [{ slug: "balcao-atendimento-gavetas", alt: "Balcão de atendimento branco com nichos, duas gavetas com chave e tampo elevado" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão de caixa em L com gaveta organizadora",
    description: "Balcão branco em L com prateleiras internas e gaveta com divisórias.",
    featured: false,
    images: [{ slug: "balcao-caixa-em-l", alt: "Balcão de caixa branco em L com gaveta aberta mostrando divisórias" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão longo com prateleiras laterais",
    description: "Balcão de atendimento longo com nichos laterais para organização.",
    featured: false,
    images: [{ slug: "balcao-longo-nichos", alt: "Balcão branco longo com nichos nas laterais" }],
  },
];

async function findOriginal(folder: string, slug: string) {
  const files = await fs.readdir(path.join(ORIGINALS, folder)).catch(() => [] as string[]);
  const match = files.find((f) => f.replace(/\.[^.]+$/, "") === slug);
  return match ? path.join(ORIGINALS, folder, match) : null;
}

async function seedAdmin() {
  if ((await db.user.count()) > 0) return;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.warn("! Nenhum administrador criado: defina ADMIN_EMAIL e ADMIN_PASSWORD (mín. 8 caracteres) no .env.");
    return;
  }
  await db.user.create({ data: { email, name: "Administrador", passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`✓ Administrador criado: ${email}`);
}

async function seedPortfolio() {
  if ((await db.category.count()) > 0 || (await db.project.count()) > 0) {
    console.log("• Banco já possui categorias/projetos — portfólio de exemplo não foi recriado.");
    return;
  }

  // Confere todos os arquivos ANTES de gravar qualquer coisa, para não deixar um portfólio pela metade.
  const missing: string[] = [];
  for (const p of projects) {
    for (const img of p.images) {
      try {
        await fs.access(path.join(TREATED, p.folder, `${img.slug}.png`));
      } catch {
        missing.push(`tratados/${p.folder}/${img.slug}.png`);
      }
      if (!(await findOriginal(p.folder, img.slug))) missing.push(`originais/${p.folder}/${img.slug}.*`);
    }
  }
  if (missing.length) {
    console.error(`✗ Arquivos não encontrados em src/projetos/:\n  - ${missing.join("\n  - ")}`);
    process.exit(1);
  }

  const categoryIds = new Map<string, string>();
  for (const [index, c] of categories.entries()) {
    const created = await db.category.create({
      data: { name: c.name, slug: slugify(c.name), description: c.description, displayOrder: index },
    });
    categoryIds.set(c.name, created.id);
  }

  const now = Date.now();
  for (const [index, p] of projects.entries()) {
    const project = await db.project.create({
      data: {
        title: p.title,
        slug: slugify(p.title),
        description: p.description,
        categoryId: categoryIds.get(p.category)!,
        featured: p.featured,
        published: true,
        // Espaça as datas para que a ordem "mais recente primeiro" siga a ordem desta lista.
        createdAt: new Date(now - index * 60 * 60 * 1000),
      },
    });
    let coverId: string | null = null;
    for (const [order, img] of p.images.entries()) {
      const treated = await storeImage(await fs.readFile(path.join(TREATED, p.folder, `${img.slug}.png`)));
      const original = await storeImage(await fs.readFile((await findOriginal(p.folder, img.slug))!));
      const row = await db.projectImage.create({
        data: {
          projectId: project.id,
          displayOrder: order,
          alt: img.alt,
          ...treated,
          originalFileKey: original.fileKey,
          originalWidth: original.width,
          originalHeight: original.height,
          originalBlurDataUrl: original.blurDataUrl,
        },
      });
      if (order === 0) coverId = row.id;
    }
    await db.project.update({ where: { id: project.id }, data: { coverImageId: coverId } });
    console.log(`✓ ${p.title} (${p.images.length} foto${p.images.length > 1 ? "s" : ""})`);
  }
}

async function main() {
  await seedAdmin();
  await seedPortfolio();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
