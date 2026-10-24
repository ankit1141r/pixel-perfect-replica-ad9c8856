import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/registrations")({
  head: () => ({ meta: [{ title: "Registrations — SPORTY" }, { name: "description", content: "Sport registration requests and their status." }, { property: "og:title", content: "Registrations — SPORTY" }, { property: "og:description", content: "Sport registration requests and their status." }] }),
  component: () => (
    <>
      <PageHeader title="Registrations" subtitle="Sport registration requests and their status." />
      <EmptyState icon={ClipboardCheck} title="No registrations" text="Submitted registrations and approvals will show here." />
    </>
  ),
});
