/**
 * Carga inicial. Idempotente: só cria o portfólio de exemplo se o banco estiver vazio
 * (nenhuma categoria e nenhum projeto) e só cria o administrador se ainda não existir nenhum.
 *
 * O portfólio inicial usa exclusivamente as fotos reais da Atlas em src/projetos/.
 * As fotos passam pelo mesmo pipeline de otimização do painel (WebP em várias larguras).
 * Títulos e descrições descrevem apenas o que aparece nas fotos e podem ser editados no painel.
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
const SOURCE = path.resolve(process.cwd(), "src/projetos");

type SeedImage = { file: string; alt: string };
type SeedProject = {
  title: string;
  description: string;
  category: string;
  featured: boolean;
  images: SeedImage[]; // a primeira é a capa
};

const categories = [
  { name: "Cozinhas", folder: "cozinhas", description: "Cozinhas planejadas sob medida." },
  { name: "Lojas", folder: "lojas", description: "Mobiliário planejado para lojas e espaços comerciais." },
  { name: "Balcões de caixa", folder: "caixa", description: "Balcões de atendimento e de caixa." },
];

const W = "WhatsApp Image 2026-09-19 at ";

const projects: (SeedProject & { folder: string })[] = [
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em verde-sálvia com detalhes amadeirados",
    description: "Armários aéreos em verde-sálvia com bordas amadeiras, nicho aberto e bancada com gavetas.",
    featured: true,
    images: [{ file: `${W}12.31.42 PM4.jpeg`, alt: "Cozinha com armários aéreos verde-sálvia, bordas amadeiradas e bancada em L com gavetas" }],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em U com armários em cinza",
    description: "Cozinha planejada em U, armários cinza com puxadores embutidos e nicho para adega.",
    featured: true,
    images: [
      { file: `${W}12.31.42 PM3.jpeg`, alt: "Cozinha em U com armários cinza, bancada de pedra e janela de madeira ao centro" },
      { file: `${W}12.31.41 PM6.jpeg`, alt: "Vista ampla da cozinha em U com armários cinza e península" },
    ],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em tons claros com nicho amadeirado",
    description: "Armários claros com nichos em madeira, integrados à geladeira e à bancada de trabalho.",
    featured: true,
    images: [{ file: `${W}12.31.41 PM5.jpeg`, alt: "Cozinha com armários em tom claro, nichos amadeirados e bancada de trabalho" }],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha em cinza brilhante com tampo preto",
    description: "Módulos em acabamento cinza brilhante com tampo escuro e cooktop embutido.",
    featured: false,
    images: [{ file: `${W}12.33.55 PM2.jpeg`, alt: "Cozinha em L com armários cinza brilhante e tampo preto com cooktop" }],
  },
  {
    folder: "cozinhas",
    category: "Cozinhas",
    title: "Cozinha branca com puxadores dourados",
    description: "Armários brancos com gavetas de puxadores em detalhe escuro e maçanetas douradas.",
    featured: false,
    images: [{ file: `${W}12.33.55 PM.jpeg`, alt: "Cozinha com armários brancos, gavetas e puxadores dourados" }],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Loja equipada com nichos, araras e painel expositor",
    description: "Conjunto de mobiliário para loja: módulo de nichos com arara, prateleiras de parede e painel canaletado.",
    featured: true,
    images: [
      { file: "123M.jpeg", alt: "Loja com módulo de nichos e arara ao fundo e balcão branco em primeiro plano" },
      { file: "45.jpeg", alt: "Painel de parede com gavetas e nichos instalado na loja" },
      { file: `${W}12.36.03 PM.jpeg`, alt: "Prateleiras brancas de parede instaladas em frente à vitrine da loja" },
      { file: `${W}12.35.59 PM.jpeg`, alt: "Painel canaletado branco para exposição de produtos" },
    ],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Arara com gavetas e nichos",
    description: "Módulos brancos com barra para cabides, gavetas com cava e nichos inferiores.",
    featured: true,
    images: [
      { file: "2.jpeg", alt: "Módulo branco com barra para cabides e gavetas instalado na loja" },
      { file: "1231.jpeg", alt: "Módulo branco com barra para cabides e gavetas, ainda na oficina" },
      { file: `${W}12.36.02 PM.jpeg`, alt: "Módulo alto com barra para cabides e seis nichos na parte inferior" },
    ],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Estantes de nichos",
    description: "Estantes brancas com nichos de diferentes tamanhos, para exposição e organização.",
    featured: false,
    images: [
      { file: "1 PM.jpeg", alt: "Estante branca com nichos e barra para cabides ao centro" },
      { file: `${W}12.36.01 PM.jpeg`, alt: "Estante ampla de nichos com prateleiras em alturas variadas" },
      { file: `${W}12.35.58 PM.jpeg`, alt: "Coluna alta de nichos brancos" },
      { file: `${W}12.36.00 PM.jpeg`, alt: "Estante de nichos com fita de borda escura e rodízios" },
      { file: "02 PM.jpeg", alt: "Estante de prateleiras inclinadas ao lado de módulo com nichos" },
    ],
  },
  {
    folder: "lojas",
    category: "Lojas",
    title: "Torres expositoras",
    description: "Duas torres brancas com prateleiras escalonadas, ideais para exposição de pequenos produtos.",
    featured: false,
    images: [{ file: "image (1).png", alt: "Duas torres brancas com prateleiras escalonadas" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão de caixa em L com gaveta organizadora",
    description: "Balcão branco em L com prateleiras internas e gaveta com divisórias.",
    featured: false,
    images: [{ file: `${W}12.39.34 PM.2jpeg.jpeg`, alt: "Balcão de caixa branco em L com gaveta aberta mostrando divisórias" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão de atendimento com gavetas e nicho",
    description: "Balcão branco com tampo elevado, gavetas com chave e nichos de apoio.",
    featured: true,
    images: [{ file: `${W}12.39.34 PM.jpeg`, alt: "Balcão de atendimento branco com gavetas com chave e nichos" }],
  },
  {
    folder: "caixa",
    category: "Balcões de caixa",
    title: "Balcão longo com prateleiras laterais",
    description: "Balcão de atendimento longo com nichos laterais para organização.",
    featured: false,
    images: [{ file: `${W}12.41.59 PM.jpeg`, alt: "Balcão branco longo com nichos laterais" }],
  },
];

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
      const buffer = await fs.readFile(path.join(SOURCE, p.folder, img.file));
      const stored = await storeImage(buffer);
      const row = await db.projectImage.create({ data: { projectId: project.id, displayOrder: order, alt: img.alt, ...stored } });
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
