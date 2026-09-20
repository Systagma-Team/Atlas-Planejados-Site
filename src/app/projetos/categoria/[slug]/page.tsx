import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveCategories } from "@/lib/content";
import { ProjectsListing } from "@/components/site/ProjectsListing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveCategories().map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const current = getActiveCategories().find((c) => c.slug === slug);
  if (!current) return { title: "Categoria não encontrada", robots: { index: false } };
  return {
    title: `Projetos de ${current.name}`,
    description: `Veja projetos de ${current.name.toLowerCase()} realizados pela Atlas Planejados.`,
    alternates: { canonical: `/projetos/categoria/${current.slug}` },
  };
}

export default async function CategoryProjectsPage({ params }: Props) {
  const { slug } = await params;
  if (!getActiveCategories().some((c) => c.slug === slug)) notFound();
  return <ProjectsListing categorySlug={slug} />;
}
