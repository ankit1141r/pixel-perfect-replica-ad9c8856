import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/sports")({
  head: () => ({ meta: [{ title: "Sports — SPORTY" }, { name: "description", content: "Cricket, football, basketball and every sport your club runs." }, { property: "og:title", content: "Sports — SPORTY" }, { property: "og:description", content: "Cricket, football, basketball and every sport your club runs." }] }),
  component: () => (
    <>
      <PageHeader title="Sports" subtitle="Cricket, football, basketball and every sport your club runs." />
      <EmptyState icon={Trophy} title="No sports yet" text="Sports will appear here once the database is connected." />
    </>
  ),
});
