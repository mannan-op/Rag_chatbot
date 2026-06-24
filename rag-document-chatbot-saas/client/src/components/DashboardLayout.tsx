import {
  Archive,
  BookOpenCheck,
  Bot,
  ChevronDown,
  Files,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { agentOptions } from "../lib/agents";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Threads", href: "/dashboard?view=threads", icon: MessageSquareText },
  { label: "Knowledge base", href: "/documents", icon: Files },
  { label: "Uploads", href: "/documents#document-upload", icon: Upload },
  { label: "Socratic learning", href: "/dashboard?mode=socratic", icon: BookOpenCheck },
  { label: "Saved answers", href: "/dashboard?view=saved", icon: Archive },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [agent, setAgent] = useState("General RAG");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isWorkspaceHome = location.pathname === "/dashboard";

  const fullName =
    typeof user?.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : "Jason";
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="workspace-shell min-h-screen bg-[#f8f8fa] text-gray-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col items-center border-r border-gray-200 bg-white py-4 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="DocuMind home"
        >
          <Bot className="h-5 w-5" />
        </button>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={() => setIsOpen(false)}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) =>
                  `group relative grid h-11 w-11 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                  }`
                }
              >
                <Icon className="h-[19px] w-[19px]" />
                <span className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            title="Log out"
            aria-label="Log out"
            className="grid h-10 w-10 place-items-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-950 text-xs font-semibold text-white ring-4 ring-gray-100"
            aria-label={`${fullName} profile`}
            title={fullName}
          >
            {initials || "U"}
          </button>
        </div>
      </aside>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-gray-950/20 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="md:pl-[76px]">
        <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 text-gray-600 md:hidden"
              aria-label={isOpen ? "Close navigation" : "Open navigation"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <label className="relative min-w-0">
              <span className="sr-only">Active agent</span>
              <Bot className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-violet-600" />
              <select
                value={agent}
                onChange={(event) => setAgent(event.target.value)}
                className="h-10 max-w-[190px] appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-violet-400 sm:max-w-none"
              >
                {agentOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-gray-400" />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-900 lg:flex"
              >
                <Search className="h-4 w-4" />
                <span>Search threads</span>
                <kbd className="ml-4 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
                  /
                </kbd>
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-900 sm:hidden"
                aria-label="Search threads"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Thread</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)]">
          {isWorkspaceHome ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
