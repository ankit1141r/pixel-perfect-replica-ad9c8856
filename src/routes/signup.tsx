import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/sporty/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema } from "@/lib/validation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join as a player — SPORTY" },
      { name: "description", content: "Create your SPORTY player account and register for sports." },
      { property: "og:title", content: "Join as a player — SPORTY" },
      { property: "og:description", content: "Create your SPORTY player account and register for sports." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({ fullName: fd.get("fullName"), email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    // Only the name is sent as metadata; the role is always assigned by the database.
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/app`, data: { full_name: parsed.data.fullName } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) window.location.assign("/app");
    else setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`} footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
        <div className="flex items-center gap-3 rounded-lg border bg-surface p-4 text-sm text-muted-foreground">
          <MailCheck className="h-5 w-5 text-primary" /> Click the link to activate your player account.
        </div>
      </AuthCard>
    );
  }

  const field = (id: string, label: string, type: string, auto: string) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} autoComplete={auto} aria-invalid={!!errors[id]} />
      {errors[id] && <p className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <AuthCard
      title="Join the club"
      subtitle="Create your player account."
      footer={<>Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {field("fullName", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", "new-password")}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthCard>
  );
}
