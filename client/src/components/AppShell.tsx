import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV_ITEMS = [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 8.5L5 11.5L12 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-semibold text-ink tracking-tight">HabitFlow</span>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-ink-muted hover:bg-black/[0.03] hover:text-ink",
            ].join(" ")
          }
        >
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col md:border-r md:border-line md:bg-surface">
        <div className="px-4 pt-5 pb-6">
          <Logo />
        </div>
        <div className="flex-1 px-3">
          <NavItems />
        </div>
        <div className="border-t border-line p-3">
          {user && (
            <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {user.email[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user.email}</p>
                <p className="truncate font-mono text-xs text-ink-faint">{user.timezone}</p>
              </div>
              <button
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-black/[0.04] hover:text-ink"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={logout}
          aria-label="Log out"
          className="rounded-md p-2 text-ink-faint hover:bg-black/[0.04] hover:text-ink"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="md:pl-60">
        <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
