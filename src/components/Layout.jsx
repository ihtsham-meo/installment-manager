import { useEffect, useState } from "react";

export default function Layout({
  user,
  page,
  setPage,
  isAdmin,
  onLogout,
  children,
}) {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products" },
    { key: "customers", label: "Customers" },
    { key: "sales", label: "Sales" },
    { key: "payments", label: "Payments" },
    { key: "reports", label: "Reports" },
    { key: "backup", label: "Backup" },
    ...(isAdmin ? [{ key: "users", label: "Users" }] : []),
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
      <aside className="w-56 bg-brand dark:bg-brand-dark text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-white/20">
          Jabir Electronics
        </div>
        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full text-left px-4 py-3 hover:bg-brand-dark transition ${page === item.key ? "bg-brand-dark font-semibold" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-brand dark:bg-brand-dark text-white flex items-center justify-between px-4">
          <div>
            {user.full_name} ({user.role})
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-neutral-800">
          {children}
        </main>
      </div>
    </div>
  );
}
