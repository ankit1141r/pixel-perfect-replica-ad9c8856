import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/sporty/Logo";
import { navItems } from "@/components/sporty/nav";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "SPORTY — Dashboard" }] }),
  component: AppLayout,
});

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {navItems.map(({ to, label, icon: Icon, admin }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/app" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary"
        >
          <Icon className="h-4 w-4" />
          {label}
          {admin && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Admin</span>}
        </Link>
      ))}
    </nav>
  );
}

function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-5 lg:flex">
        <Logo />
        <div className="mt-8 flex-1"><NavList /></div>
        <Button variant="ghost" asChild className="justify-start text-muted-foreground">
          <Link to="/login"><LogOut className="h-4 w-4" /> Sign out</Link>
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-5">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <div className="mt-8"><NavList onNavigate={() => setOpen(false)} /></div>
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
