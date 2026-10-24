import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/matches")({
  head: () => ({ meta: [{ title: "Fixtures — SPORTY" }, { name: "description", content: "Upcoming and past matches." }, { property: "og:title", content: "Fixtures — SPORTY" }, { property: "og:description", content: "Upcoming and past matches." }] }),
  component: () => (
    <>
      <PageHeader title="Fixtures" subtitle="Upcoming and past matches." />
      <EmptyState icon={CalendarDays} title="No fixtures scheduled" text="Scheduled matches will be listed here." />
    </>
  ),
});
