# Atlas Planejados — site institucional

Site de portfólio de móveis planejados. É **100% estático**: não há banco de dados, painel nem servidor. Todo o conteúdo
(projetos, fotos, categorias, contatos) fica em arquivos na pasta [`conteudo/`](conteudo/) e é versionado junto com o
código. Para mudar algo, edita-se um arquivo, envia-se para o GitHub e o site se atualiza — de graça, em qualquer
hospedagem de arquivos estáticos.

Stack: Next.js 16 (App Router, `output: "export"`), React 19, CSS Modules com design tokens, sharp (fotos otimizadas
no build) e zod (validação do conteúdo). Fontes locais (Fraunces e DM Sans).

## Como editar o conteúdo

Pré-requisito: Node 22 e `npm install` (uma vez).

| Quero… | Faça |
|---|---|
| Ver o site enquanto edito | `npm run dev` → http://localhost:3000 (recarrega ao salvar; se mexer em `conteudo/` com o servidor ligado, rode `npm run conteudo`) |
| Conferir o conteúdo sem subir o site | `npm run conteudo` (avisa erros em português: arquivo, campo e o que corrigir) |
| Adicionar um projeto | `npm run novo:projeto -- "Título do projeto" <categoria>` e siga as instruções que aparecem |
| Gerar o site final | `npm run build` (cria a pasta `out/`) |
| Ver o site final | `npm run preview` → http://localhost:3001 |

### Estrutura

```
conteudo/
  site.json            contatos, endereço, mapa, texto "Sobre", endereço final do site
  categorias.json      categorias e a ordem em que aparecem
  projetos/<nome>/     uma pasta por projeto; o nome da pasta vira o endereço (/projetos/<nome>)
    projeto.json
    <fotos>
```

### `site.json`

Só aparece no site o que estiver preenchido; campos vazios (`""`) ficam escondidos.

| Campo | O que é |
|---|---|
| `urlDoSite` | endereço final do site, ex. `https://www.atlasplanejados.com.br` (usado no Google e ao compartilhar). **Preencher antes de publicar.** |
| `whatsapp`, `whatsapp2` | números com DDD. Com dois, o botão flutuante deixa escolher (principal / secundário) |
| `telefone`, `email`, `endereco`, `horarioDeAtendimento` | exibidos em Contato e no rodapé |
| `instagram`, `facebook` | endereço completo do perfil |
| `mapaGoogle` | Google Maps → Compartilhar → Incorporar um mapa → copie só o endereço do `src="…"` |
| `textoSobre` | lista de parágrafos da página "Sobre". Enquanto vazia, o site mostra um aviso de "conteúdo provisório" |

### `categorias.json`

```json
[
  { "slug": "cozinhas", "nome": "Cozinhas", "descricao": "Cozinhas planejadas sob medida.", "ativa": true }
]
```

A ordem da lista é a ordem no site. `"ativa": false` esconde a categoria **e** os projetos dela (nada é apagado).
Categorias sem projetos visíveis não aparecem.

### `projeto.json`

```json
{
  "titulo": "Guarda-roupa com espelho iluminado",
  "categoria": "guarda-roupas",
  "descricao": "Resumo de uma ou duas frases (cartões e Google).",
  "detalhes": ["Parágrafo opcional com mais detalhes.", "Outro parágrafo."],
  "destaque": true,
  "publicado": true,
  "ano": 2026,
  "data": "2026-09-19",
  "fotos": [
    {
      "tratada": "espelho-aceso.png",
      "original": "espelho-aceso-original.jpeg",
      "alt": "Guarda-roupa com portas rosadas e espelho oval iluminado"
    }
  ]
}
```

- `categoria`: o `slug` de uma categoria existente.
- `destaque`: mostra na página inicial (a foto do topo do site é o destaque mais recente).
- `publicado: false`: rascunho — não aparece no site.
- `data`: define a ordem (mais recente primeiro). `ano` e `detalhes` são opcionais.
- `fotos`: a primeira é a capa. `tratada` é a que o site mostra; `original` (opcional) é a foto sem tratamento, que o
  visitante só vê se escolher "Ver foto original". `alt` descreve a foto (acessibilidade e SEO) — descreva só o que
  aparece na imagem.
- Formatos aceitos: JPG, PNG, WebP. Não precisa reduzir o tamanho: o build gera as versões otimizadas.

### Trocar ou remover coisas

- **Trocar uma foto:** substitua o arquivo na pasta do projeto (mesmo nome) ou aponte outro nome em `fotos`.
- **Excluir um projeto:** apague a pasta dele (ou use `"publicado": false` para só escondê-lo).
- **Renomear o endereço de um projeto:** renomeie a pasta (o endereço antigo deixa de existir).

## Publicar (gratuito)

O build gera a pasta `out/`, que pode ser hospedada em qualquer serviço de arquivos estáticos.

### GitHub Pages (já configurado)

`.github/workflows/deploy.yml` publica a cada envio para a `main`. Configuração única:
1. Repositório → **Settings → Pages → Source: GitHub Actions**.
2. Repositório **público** (o GitHub Pages não publica repositório privado no plano gratuito).
3. Site em subcaminho (`usuario.github.io/repositorio`)? Crie a variável `BASE_PATH` com `/repositorio`
   (Settings → Secrets and variables → Actions → Variables). Com domínio próprio, deixe em branco.

### Cloudflare Pages / Netlify (aceitam repositório privado)

- Build command: `npm run build` · Output directory: `out` · variável `NODE_VERSION=22`.
- O arquivo `public/_headers` já traz cabeçalhos de segurança e cache das fotos.

### Domínio próprio

Aponte o domínio no serviço escolhido e preencha `urlDoSite` em `conteudo/site.json`.

## Como funciona por dentro

1. `npm run conteudo` (roda sozinho antes de `dev` e `build`) lê `conteudo/`, valida com zod e gera:
   - `public/media/<hash>/<largura>.webp` — fotos em 480/960/1600/2400 px + miniatura desfocada (com cache em `.cache/`);
   - `src/generated/conteudo.json` — dados usados nas páginas.
   Ambos são gerados (não vão para o Git).
2. `next build` transforma tudo em HTML estático (`out/`), e `scripts/postbuild-export.ts` ajusta os arquivos de
   pré-carregamento para funcionar em qualquer hospedagem.
3. Leitura do conteúdo: `src/lib/content.ts`. Regra de visibilidade única: projeto publicado + categoria ativa + ao menos
   uma foto.

```
src/app/            páginas (/, /projetos, /projetos/[slug], /projetos/categoria/[slug], /sobre, /contato)
src/components/     site/ (seções) e ui/ (botão, ícones, imagem)
src/styles/         tokens.css (cores, tipografia, espaçamento) · base.css
scripts/            build-content.ts · new-project.ts · postbuild-export.ts
conteudo/           todo o conteúdo editável
```

## Fotos tratadas × originais

As imagens do portfólio foram tratadas digitalmente. O site mostra a tratada por padrão, avisa isso ao visitante e, em
cada projeto, oferece "Ver foto original" (a original só aparece se o visitante escolher). Para isso, informe o campo
`original` de cada foto.

## Atendimento

Sem formulário: o contato é por WhatsApp (botão flutuante em todas as páginas + página Contato) e Instagram.
Isso evita spam e a necessidade de e-mail/servidor para receber mensagens.

## Conteúdo provisório (não inventado)

Nada de informações da empresa foi inventado. Enquanto estiverem vazios em `site.json`, ficam escondidos: telefone,
e-mail, endereço, horário, mapa, Facebook e o texto "Sobre" (que mostra um aviso de conteúdo provisório).
Títulos e descrições dos projetos descrevem apenas o que aparece nas fotos e podem ser ajustados.

## Acessibilidade e desempenho

Navegação por teclado com foco visível, link "pular para o conteúdo", contraste AA, `prefers-reduced-motion`,
fotos responsivas (`srcset`) com carregamento sob demanda e reserva de espaço (sem saltos de layout). Testado com
axe-core (0 violações nas páginas públicas).
