import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/scoreboard")({
  head: () => ({ meta: [{ title: "Scoreboard — SPORTY" }, { name: "description", content: "Live scores and final results." }, { property: "og:title", content: "Scoreboard — SPORTY" }, { property: "og:description", content: "Live scores and final results." }] }),
  component: () => (
    <>
      <PageHeader title="Scoreboard" subtitle="Live scores and final results." />
      <EmptyState icon={Gauge} title="No results yet" text="Completed and live match scores will show here." />
    </>
  ),
});
