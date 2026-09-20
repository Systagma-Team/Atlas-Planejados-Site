import type { Metadata } from "next";
import { getCategoriesWithCover, getFeaturedProjects } from "@/lib/content";
import { getSettings } from "@/lib/content";
import { Hero } from "@/components/site/Hero";
import { Intro } from "@/components/site/Intro";
import { FeaturedProjects } from "@/components/site/FeaturedProjects";
import { CategoryIndex } from "@/components/site/CategoryIndex";
import { ValueProposition } from "@/components/site/ValueProposition";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { Differentials } from "@/components/site/Differentials";
import { ContactCta } from "@/components/site/ContactCta";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Atlas Planejados — Móveis planejados sob medida" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, categories, settings] = await Promise.all([getFeaturedProjects(5), getCategoriesWithCover(), getSettings()]);
  const [heroProject, ...rest] = featured;

  return (
    <>
      <Hero project={heroProject ?? null} />
      <Intro />
      {/* O projeto do hero também aparece na curadoria: mantemos todos para não perder o destaque principal. */}
      <FeaturedProjects projects={heroProject ? [heroProject, ...rest] : []} />
      <CategoryIndex categories={categories} />
      <ValueProposition />
      <ProcessSteps />
      <Differentials />
      <ContactCta settings={settings} />
    </>
  );
}
