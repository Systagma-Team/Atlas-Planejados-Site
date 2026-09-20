import type { Metadata } from "next";
import { ProjectsListing } from "@/components/site/ProjectsListing";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Portfólio da Atlas Planejados: projetos reais de móveis planejados sob medida.",
  alternates: { canonical: "/projetos" },
};

export default function ProjectsPage() {
  return <ProjectsListing />;
}
