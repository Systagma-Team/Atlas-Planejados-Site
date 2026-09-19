# Atlas Planejados — site institucional + painel administrativo

Site público (portfólio de móveis planejados) e painel para o próprio cliente cadastrar projetos, organizar categorias e manter as informações de contato — sem mexer em código.

**Stack:** Next.js 16 (App Router, React 19) · Prisma 6 + Postgres (Supabase) · Supabase Storage · sharp (otimização de fotos) · jose + bcryptjs (sessão/senha) · zod (validação) · CSS puro com design tokens.

## Como rodar

```bash
npm install
npm run db:local            # (terminal 1) Postgres local sem Docker — deixe rodando
npx prisma migrate deploy   # (terminal 2) cria as tabelas
npm run db:seed             # cria o administrador + importa as fotos reais de src/projetos/
npm run dev                 # http://localhost:3000   (painel: /admin)
```

O `.env` já foi gerado localmente (`AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). **Troque a senha no primeiro acesso** em *Painel → Minha conta*. Para criar/redefinir um administrador pela linha de comando: `npm run admin:create -- email@exemplo.com "nova senha"`.

Produção: `npm run build && npm start`. Veja *Publicação* abaixo.

## O que o cliente controla (tudo pelo painel)

| Área | O que faz |
|---|---|
| **Projetos** | criar, editar, excluir (com confirmação), publicar/despublicar, destacar na Home, enviar várias fotos, arrastar para reordenar, escolher a capa, descrever cada foto |
| **Categorias** | criar, renomear, mudar endereço e ordem, **ocultar/mostrar**. Excluir só é permitido se a categoria estiver vazia |
| **Mensagens** | pedidos de orçamento enviados pelo formulário do site |
| **Informações do site** | WhatsApp, telefone, e-mail, endereço, horário, Instagram, Facebook, mapa, texto da página *Sobre* |
| **Minha conta** | nome, e-mail e senha |

Estados em linguagem simples: **Publicado**, **Rascunho**, **Oculto** (publicado, mas a categoria está oculta).

Nada é fixo no código: as categorias, o portfólio, os canais de contato e a foto do hero vêm do banco. Canais de contato vazios simplesmente não aparecem no site.

## Regras de negócio implementadas

- Um projeto só aparece no site se estiver **publicado** e sua **categoria estiver ativa** (regra única em `src/server/queries/public.ts`).
- Projeto sem foto não pode ser publicado; remover a última foto de um projeto publicado o devolve a rascunho.
- Categoria com projetos **nunca** é apagada: além da regra no serviço, o banco usa `onDelete: Restrict`.
- Mudar o título de um projeto/categoria **não** muda o endereço (URL) já divulgado.
- Excluir um projeto apaga também os arquivos das fotos.

## Arquitetura

```
prisma/               schema, migração e seed (usa as fotos reais)
src/
  app/(site)/         site público  → /, /projetos, /projetos/[slug], /sobre, /contato
  app/admin/          painel        → login + (panel)/ dashboard, projetos, categorias, mensagens, configuracoes, conta
  app/api/admin/      APIs de fotos (upload, reordenar, capa, alt, excluir) — sempre autenticadas
  app/media/          entrega das fotos otimizadas (cache imutável de 1 ano)
  proxy.ts            1ª barreira: /admin e /api/admin exigem sessão
  server/             regras de negócio (services/), consultas do site (queries/), auth/, imagens
  components/ui|site|admin/   componentes reutilizáveis
  styles/             tokens.css (design system), base.css, admin.css
```

Separação: **UI** (components) → **ações** (`actions.ts`, só validam sessão e chamam o serviço) → **serviços** (regras + Prisma). Nenhuma regra de negócio dentro de componente visual.

### Segurança
- Senha com bcrypt (custo 12); sessão em JWT assinado, cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção, validade de 14 dias. Trocar a senha encerra as outras sessões.
- Proteção em camadas: `proxy.ts` → guardas nas páginas/ações (`requireAdmin`) → guarda nas APIs (`requireAdminApi`, com checagem de origem contra CSRF). Login com limite de tentativas e mensagem única de erro.
- Formulário de contato com campo-armadilha e limite por IP. Painel `noindex` e fora do `robots`/sitemap. Nenhum link para o painel no site público.

### Fotos
Cada upload passa por `sharp`: corrige a rotação do celular, **nunca amplia**, gera WebP em 480/960/1600/2400 px (só as menores que a original) e um placeholder borrado de ~1 KB. No site, `srcset`/`sizes` deixam o navegador escolher a versão certa; `width`/`height` reservam o espaço (CLS 0); tudo é `lazy` exceto a foto do hero. Fotos aparecem **inteiras** (proporção original); só cards/hero recortam, com `object-fit: cover`, nunca esticando.

### Design system Atlas (`src/styles/tokens.css`)
Sintetizado das duas referências em `design_system/`: o wireframe *Desktop 1920* (fundo `#F6F4F2`, marrom `#947458`, seções em faixas) e o kit *Formly* (canvas creme, areia `#D0BCA1`, pílulas, muito respiro). Adaptações: display em **Fraunces** (serifa editorial) + corpo em **DM Sans**; espresso `#1F1A16` para contraste; `#947458` só decorativo (dá 4,3:1 com branco), `#7C5F44`/`#6A4F36` onde há texto. Nenhuma imagem das referências foi usada.

### SEO
`title`/`description` por página e por projeto, Open Graph com a capa do projeto, `canonical`, `sitemap.xml` dinâmico (só projetos visíveis), `robots.txt`, URLs amigáveis (`/projetos/cozinha-em-u-com-armarios-em-cinza`), `alt` editável por foto, HTML semântico com um `<h1>` por página.

## Publicação (Netlify + Supabase)

O site roda em funções serverless (Netlify); os dados ficam no **Supabase** (Postgres + Storage). Nada depende de disco do servidor.

**1. Supabase** (você cria; leva ~5 min) — novo projeto, região São Paulo. Em *Storage* crie o bucket **`projetos`** marcado como **Public**. Guarde: senha do banco, `Project URL`, chave `service_role` (secreta).

**2. Criar as tabelas** (uma vez, do seu computador). Copie `.env.example` para `.env.supabase` (ignorado pelo Git), preencha com os valores do Supabase e rode:
```bash
npm run prod:check     # confere o ambiente e testa banco + Storage (sem mostrar segredos)
npm run prod:migrate   # cria as tabelas e liga o RLS
npm run prod:admin     # cria o administrador (ADMIN_EMAIL / ADMIN_PASSWORD do arquivo)
npm run prod:seed      # OPCIONAL: carrega o portfólio de exemplo
npm run prod:build && npm run prod:start   # (opcional) roda o site localmente apontando para o Supabase
```

**3. Netlify** — importe o repositório (o `netlify.toml` já está pronto) e cadastre em *Environment variables* os valores de `.env.example` para produção: `DATABASE_URL`, `DIRECT_URL`, `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `NEXT_PUBLIC_MEDIA_BASE_URL` (lida no *build*: se mudar, faça novo deploy), `AUTH_SECRET` (gere uma nova!) e `SITE_URL`. O build consulta o banco, então `DATABASE_URL` precisa existir no ambiente de build.

**4. Domínio e depois do primeiro deploy** — ligue o domínio, ajuste `SITE_URL`, entre em `/admin` com o administrador criado e **troque a senha**. Configure o ping (seção abaixo).

Segurança no Supabase: todas as tabelas têm **RLS ligado sem políticas** (migração `enable_rls`), então a API REST automática do Supabase não expõe nenhum dado; o site acessa o banco pelo papel `postgres` via Prisma. A chave `service_role` só existe no servidor. O bucket é público **apenas para leitura**; só o servidor grava/apaga.

Alternativa sem serverless: um servidor Node com disco persistente (VPS) funciona com `STORAGE_DRIVER=local`, `npm run build && npm start`, HTTPS na frente e backup da pasta `data/`.

**Limites e cuidados serverless (já tratados):** fotos grandes são reduzidas no navegador antes do envio (as funções limitam o corpo da requisição) e enviadas uma por vez; o limitador de tentativas (login, contato, `/api/health`) fica no banco. Confirme no primeiro deploy que o `proxy.ts` (Next 16) e o cache incremental funcionam no adaptador da Netlify — o painel também confere a sessão dentro de cada página e API, então a proteção não depende só do `proxy`.

## Manter o banco ativo (ping automático)

Projetos gratuitos do Supabase são **pausados após cerca de 7 dias sem atividade** (confirme a regra atual na documentação). As páginas públicas ficam em cache e não consultam o banco a cada visita, então visitas comuns não bastam.

- `GET /api/health` faz uma leitura real no banco e responde `{"ok":true}` (200) ou 503 se o banco falhar. Não expõe dados, é `no-store`, tem limite de 30 chamadas/min por IP e está bloqueado no `robots.txt`.
- `.github/workflows/keep-alive.yml` chama esse endereço às 09:17 e 21:17 UTC. Para ativar: suba o projeto para um repositório no GitHub e cadastre o segredo `HEALTH_URL` (ex.: `https://www.seudominio.com.br/api/health`). Alternativa sem GitHub: um agendador gratuito (ex.: cron-job.org) chamando o mesmo endereço 1–2 vezes por dia.
- Se o agendador falhar, o GitHub avisa por e-mail; vale conferir de vez em quando se ele continua rodando. Um plano pago (Pro) dispensa o ping.

## Conteúdo provisório (substituir com dados reais)

Nada sobre a empresa foi inventado (sem endereço, telefone, redes, anos, números ou depoimentos). Os textos abaixo são **genéricos de posicionamento** e estão marcados com `CONTEÚDO PROVISÓRIO` no código:

- `ValueProposition.tsx` — proposta de valor · `ProcessSteps.tsx` — etapas do processo · `Differentials.tsx` — diferenciais · `sobre/page.tsx` — propósito/filosofia/qualidade · `Intro.tsx` e `Hero.tsx` — frases de apresentação.
- Página *Sobre*: o bloco **“Conteúdo provisório”** some sozinho quando o texto é preenchido em *Informações do site*.
- Logo: marca tipográfica provisória (`components/site/Logo.tsx`).
- **Portfólio inicial**: as 22 fotos de `src/projetos/` viraram 12 projetos em 3 categorias (Cozinhas, Lojas, Balcões de caixa — nomes tirados das pastas). Títulos e resumos descrevem só o que se vê nas fotos e **não têm ano**. Edite/substitua pelo painel quando tiver as fotos tratadas.

## Testes feitos

Fluxo ponta a ponta no navegador (47 verificações): rotas e APIs bloqueadas sem login, login/logout/sessão, criar/duplicar categoria, criar projeto, validação preservando o que foi digitado, upload, arquivo inválido, reordenar/capa/alt persistindo, publicar/despublicar, ocultar categoria (some do site, permanece no painel), exclusão com confirmação (e arquivos removidos do disco), exclusão de categoria bloqueada quando há projetos. Acessibilidade (axe, WCAG 2.1 AA): 0 violações nas páginas públicas e no painel. Build de produção: LCP ≈ 0,2–0,6 s, CLS 0.
