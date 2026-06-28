import {
  BarChart2,
  Calendar,
  LayoutGrid,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

type Tab = {
  end?: boolean;
  icon: LucideIcon;
  label: string;
  to: string;
};

const TABS: Tab[] = [
  { end: true, icon: LayoutGrid, label: "Pregled", to: "/admin" },
  { icon: Users, label: "Korisnici", to: "/admin/users" },
  { icon: Calendar, label: "Treninzi", to: "/admin/sessions" },
  { icon: BarChart2, label: "Statistika", to: "/admin/stats" },
];

export default function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[calc(70px+env(safe-area-inset-bottom))] w-full max-w-[480px] border-t border-border bg-surface/97 pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-[70px] grid-cols-4 px-2 pt-2">
        {TABS.map(({ end, icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[11px] ${
                isActive
                  ? "font-bold text-burgundy"
                  : "font-semibold text-[#B3A9B2]"
              }`
            }
            end={end}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
