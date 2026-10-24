import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/teams")({
  head: () => ({ meta: [{ title: "Teams — SPORTY" }, { name: "description", content: "Squads across every sport." }, { property: "og:title", content: "Teams — SPORTY" }, { property: "og:description", content: "Squads across every sport." }] }),
  component: () => (
    <>
      <PageHeader title="Teams" subtitle="Squads across every sport." />
      <EmptyState icon={Shield} title="No teams yet" text="Create teams for each sport and assign players." />
    </>
  ),
});
