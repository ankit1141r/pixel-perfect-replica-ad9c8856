import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/sporty/Logo";
import { navItems } from "@/components/sporty/nav";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "SPORTY — Dashboard" }] }),
  component: AppLayout,
});

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useMe();
  const items = navItems.filter((i) => !i.admin || me?.isAdmin);
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/app" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function UserBox() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="space-y-3 border-t pt-4">
      {me && (
        <div className="px-1">
          <div className="truncate text-sm font-medium">{me.fullName}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={me.isAdmin ? "default" : "muted"}>{me.isAdmin ? "Admin" : "Player"}</Badge>
          </div>
        </div>
      )}
      <Button variant="ghost" onClick={signOut} className="w-full justify-start text-muted-foreground">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-5 lg:flex">
        <Logo />
        <div className="mt-8 flex-1 overflow-y-auto"><NavList /></div>
        <UserBox />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-5">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <div className="mt-8 flex-1"><NavList onNavigate={() => setOpen(false)} /></div>
            <UserBox />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
