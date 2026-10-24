import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-wide">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">S</span>
      SPORTY
    </Link>
  );
}
