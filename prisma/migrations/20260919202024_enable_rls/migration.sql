-- Segurança no Supabase: o schema "public" é exposto por uma API REST automática (PostgREST) que usa as chaves
-- "anon"/"authenticated". Com RLS ligado e SEM políticas, essa API não enxerga nenhuma linha destas tabelas.
-- O site acessa o banco pelo papel "postgres" (via Prisma), que ignora o RLS, então nada muda para a aplicação.
ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectImage"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
