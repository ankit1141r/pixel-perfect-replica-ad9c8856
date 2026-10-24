import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/reports")({
  head: () => ({ meta: [{ title: "Reports — SPORTY" }, { name: "description", content: "Registration trends and club analytics." }, { property: "og:title", content: "Reports — SPORTY" }, { property: "og:description", content: "Registration trends and club analytics." }] }),
  component: () => (
    <>
      <PageHeader title="Reports" subtitle="Registration trends and club analytics." />
      <EmptyState icon={BarChart3} title="No data to report" text="Reports build up as players register and matches are played." />
    </>
  ),
});
