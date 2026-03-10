"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ComponentType,
  ReactNode,
  SVGProps,
  useEffect,
  useMemo,
  useState,
} from "react";

type StoredUser = {
  name: string;
  role?: string;
};

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
};

const DashboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M3 12.75 12 4l9 8.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.25 10.5V20h13.5v-9.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BoxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="m12 3 8.25 4.5L12 12 3.75 7.5 12 3Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.25 7.5V16.5L12 21 3.75 16.5V7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CupboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="4.5" y="3.75" width="15" height="16.5" rx="2" />
    <path d="M12 3.75v16.5" strokeLinecap="round" />
    <path d="M9.25 10.5h.01M14.75 10.5h.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlaceIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 20.25s6-4.64 6-10.03a6 6 0 1 0-12 0c0 5.39 6 10.03 6 10.03Z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10.25" r="2.25" />
  </svg>
);

const BorrowingIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M7.5 7.5h9A3.75 3.75 0 1 1 16.5 15H5.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m8.25 11.25-3.75 3.75 3.75 3.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 4.5h6" strokeLinecap="round" />
  </svg>
);

const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M15.75 19.5v-.75A3.75 3.75 0 0 0 12 15h-3a3.75 3.75 0 0 0-3.75 3.75v.75" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="8.25" r="3" />
    <path d="M18 19.5v-.75A3 3 0 0 0 15.75 15.86" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 5.66a3 3 0 0 1 0 5.18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AuditIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M8.25 6.75h9" strokeLinecap="round" />
    <path d="M8.25 11.25h9" strokeLinecap="round" />
    <path d="M8.25 15.75h5.25" strokeLinecap="round" />
    <path d="M5.25 6.75h.01M5.25 11.25h.01M5.25 15.75h.01" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2" />
  </svg>
);

const navigationItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/dashboard/items", label: "Inventory Items", Icon: BoxIcon },
  { href: "/dashboard/cupboards", label: "Storage: Cupboards", Icon: CupboardIcon },
  { href: "/dashboard/places", label: "Storage: Places", Icon: PlaceIcon },
  { href: "/dashboard/borrowings", label: "Borrowings", Icon: BorrowingIcon },
  { href: "/dashboard/users", label: "Users", Icon: UsersIcon, adminOnly: true },
  { href: "/dashboard/audit-logs", label: "Audit Logs", Icon: AuditIcon, adminOnly: true },
];

const readStoredUser = (): StoredUser | null => {
  const storedUser = window.localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as StoredUser;
  } catch {
    return null;
  }
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    const parsedUser = readStoredUser();

    if (!token || !parsedUser) {
      router.replace("/login");
      return;
    }

    setUser(parsedUser);
    setIsCheckingAuth(false);
  }, [router]);

  const visibleNavigationItems = useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.adminOnly) {
        return true;
      }

      return user?.role === "admin";
    });
  }, [user]);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Preparing your workspace...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-[#0f172a] text-slate-100 lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Inventory Management
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Control Center
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Manage inventory, storage, borrowing workflows, and internal operations.
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {visibleNavigationItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-gray-50">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur xl:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              Workspace
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                {user?.role ?? "user"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}