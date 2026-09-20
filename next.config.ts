import type { NextConfig } from "next";

// Site 100% estático: `next build` gera a pasta `out/`, que pode ser publicada em qualquer hospedagem de arquivos
// (GitHub Pages, Cloudflare Pages, Netlify…). Se o site ficar num subcaminho (ex.: usuario.github.io/repositorio),
// defina BASE_PATH=/repositorio no build.
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");

const config: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default config;
