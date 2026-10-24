import {
  LayoutDashboard, Users, Trophy, Shield, CalendarDays, ClipboardCheck,
  BarChart3, UserCog, Gauge, type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; admin?: boolean };

export const navItems: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/sports", label: "Sports", icon: Trophy },
  { to: "/app/teams", label: "Teams", icon: Shield },
  { to: "/app/matches", label: "Fixtures", icon: CalendarDays },
  { to: "/app/scoreboard", label: "Scoreboard", icon: Gauge },
  { to: "/app/players", label: "Players", icon: Users },
  { to: "/app/registrations", label: "Registrations", icon: ClipboardCheck },
  { to: "/app/reports", label: "Reports", icon: BarChart3, admin: true },
  { to: "/app/profile", label: "Profile", icon: UserCog },
];
