import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AppStatus, useAppStore } from "./store";

const navItems = [
  { to: "/wallet", label: "Wallet" },
  { to: "/sign", label: "Sign Guard" },
  { to: "/voice", label: "Voice Commander" },
  { to: "/chat", label: "Portfolio Brain" },
];

const statusCopy: Record<AppStatus, string> = {
  idle: "QVAC idle",
  loading: "Loading models",
  ready: "Models ready",
  error: "Needs attention",
};

const statusTone: Record<AppStatus, string> = {
  idle: "bg-amber-50 text-amber-700",
  loading: "bg-sky-50 text-sky-700",
  ready: "bg-emerald-50 text-emerald-700",
  error: "bg-rose-50 text-rose-700",
};

const statusDotTone: Record<AppStatus, string> = {
  idle: "bg-amber-500",
  loading: "bg-sky-500",
  ready: "bg-emerald-500",
  error: "bg-rose-500",
};

export function AppLayout() {
  const qvacStatus = useAppStore((state) => state.qvacStatus);
  const qvacError = useAppStore((state) => state.qvacError);
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="float-in">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Aegis
            </p>
            <h1 className="text-3xl font-semibold text-ink">
              Sovereign AI Solana Wallet
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Every model runs locally. Every decision stays with you. No
              telemetry, no cloud inference.
            </p>
          </div>
          <div className="float-in-delay flex items-center gap-3">
            <span className={`status-pill ${statusTone[qvacStatus]}`}>
              <span
                className={`h-2 w-2 rounded-full ${statusDotTone[qvacStatus]}`}
              ></span>
              {statusCopy[qvacStatus]}
            </span>
            <span className="hidden text-xs text-slate-500 md:inline">
              Devnet ready
            </span>
          </div>
        </header>

        <nav className="flex flex-wrap gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-pill ${isActive ? "nav-pill-active" : "nav-pill-idle"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {qvacStatus !== "ready" && (
          <section className="glass-panel">
            <p className="text-sm font-semibold text-ink">
              Local models are still warming up.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              You can explore the UI while QVAC initializes. Once the models are
              loaded, the AI flows activate instantly.
            </p>
            {qvacError && (
              <p className="mt-3 text-sm text-rose-600">{qvacError}</p>
            )}
          </section>
        )}

        <main className="flex flex-col gap-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
