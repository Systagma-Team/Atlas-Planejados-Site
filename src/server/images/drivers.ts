import "server-only";
import path from "node:path";
import { promises as fs } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/**
 * Onde as fotos otimizadas ficam guardadas. Escolhido por STORAGE_DRIVER:
 *  - "local":    pasta UPLOAD_DIR do servidor (desenvolvimento ou VPS com disco persistente)
 *  - "supabase": bucket público do Supabase Storage (hospedagem serverless, como Netlify)
 * Os arquivos são sempre <pasta>/<largura>.webp, onde <pasta> é o fileKey da foto.
 */
export interface StorageDriver {
  readonly name: "local" | "supabase";
  put(objectPath: string, data: Buffer, contentType: string): Promise<void>;
  removeFolder(folder: string): Promise<void>;
  /** Só o driver local serve arquivos pela própria aplicação (rota /media). */
  read(objectPath: string): Promise<{ data: Buffer; size: number } | null>;
}

export function uploadRoot() {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR || "./data/uploads");
}

const localDriver: StorageDriver = {
  name: "local",
  async put(objectPath, data) {
    const file = path.join(uploadRoot(), objectPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  },
  async removeFolder(folder) {
    await fs.rm(path.join(uploadRoot(), folder), { recursive: true, force: true });
  },
  async read(objectPath) {
    try {
      const data = await fs.readFile(path.join(uploadRoot(), objectPath));
      return { data, size: data.length };
    } catch {
      return null;
    }
  },
};

function supabaseDriver(): StorageDriver {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "projetos";
  if (!url || !key) {
    throw new Error("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  }
  // A chave de serviço só existe no servidor; nunca vai para o navegador.
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    name: "supabase",
    async put(objectPath, data, contentType) {
      const { error } = await client.storage.from(bucket).upload(objectPath, data, {
        contentType,
        // Os nomes nunca se repetem (fileKey único), então o cache pode ser longo.
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw new Error(`Falha ao enviar a foto ao armazenamento: ${error.message}`);
    },
    async removeFolder(folder) {
      const { data: files, error } = await client.storage.from(bucket).list(folder, { limit: 100 });
      if (error) throw new Error(`Falha ao listar as fotos: ${error.message}`);
      if (!files?.length) return;
      const { error: removeError } = await client.storage.from(bucket).remove(files.map((f) => `${folder}/${f.name}`));
      if (removeError) throw new Error(`Falha ao remover as fotos: ${removeError.message}`);
    },
    async read() {
      return null;
    },
  };
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (!cached) cached = process.env.STORAGE_DRIVER === "supabase" ? supabaseDriver() : localDriver;
  return cached;
}
