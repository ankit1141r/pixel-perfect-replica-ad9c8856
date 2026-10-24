import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/players")({
  head: () => ({ meta: [{ title: "Players — SPORTY" }, { name: "description", content: "Directory of registered players." }, { property: "og:title", content: "Players — SPORTY" }, { property: "og:description", content: "Directory of registered players." }] }),
  component: () => (
    <>
      <PageHeader title="Players" subtitle="Directory of registered players." />
      <EmptyState icon={Users} title="No players yet" text="Players appear here after they sign up." />
    </>
  ),
});
