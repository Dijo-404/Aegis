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

const statusBadge: Record<AppStatus, string> = {
  idle: "stripe-badge-warning",
  loading: "stripe-badge-neutral",
  ready: "stripe-badge-success",
  error: "stripe-badge-danger",
};

const statusDot: Record<AppStatus, string> = {
  idle: "bg-lemon",
  loading: "bg-purple-mid",
  ready: "bg-success",
  error: "bg-ruby",
};

export function AppLayout() {
  const qvacStatus = useAppStore((state) => state.qvacStatus);
  const qvacError = useAppStore((state) => state.qvacError);
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <NavLink to="/wallet" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-purple text-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2 4 6v6c0 5 3.4 9.5 8 10 4.6-.5 8-5 8-10V6l-8-4Z" />
                </svg>
              </span>
              <span className="text-base font-normal text-heading">Aegis</span>
            </NavLink>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "stripe-nav-link-active" : "stripe-nav-link"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`${statusBadge[qvacStatus]} !px-2 !py-0.5 !text-[11px]`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDot[qvacStatus]}`}
              />
              {statusCopy[qvacStatus]}
            </span>
            <span className="hidden text-xs font-normal text-body lg:inline">
              Devnet
            </span>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="border-b border-border md:hidden">
        <nav className="mx-auto flex max-w-[1080px] gap-1 overflow-x-auto px-6 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "stripe-nav-link-active" : "stripe-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[1080px] px-6 py-12 lg:py-16">
        <div className="flex flex-col gap-12">
          {/* Hero */}
          <div className="float-in flex flex-col gap-4">
            <p className="stripe-kicker">Aegis · Solana</p>
            <h1 className="text-display-large tracking-display-large text-heading md:text-display-hero md:tracking-display-hero">
              The sovereign AI wallet for Solana.
            </h1>
            <p className="max-w-2xl text-lg font-light leading-relaxed text-body">
              Every model runs locally. Every decision stays with you. No
              telemetry, no cloud inference — just transparent, on-device
              intelligence guarding your keys.
            </p>
          </div>

          {qvacStatus !== "ready" && (
            <section className="stripe-card-ambient flex items-start gap-4">
              <span
                className={`mt-1 h-2 w-2 flex-none rounded-full ${statusDot[qvacStatus]}`}
              />
              <div className="flex flex-col gap-1">
                <p className="text-base font-normal text-heading">
                  Local models are warming up.
                </p>
                <p className="text-sm font-light leading-relaxed text-body">
                  Explore the UI while QVAC initializes. Once models are loaded,
                  the AI flows activate instantly.
                </p>
                {qvacError && (
                  <p className="mt-1 font-mono text-xs text-ruby">
                    {qvacError}
                  </p>
                )}
              </div>
            </section>
          )}

          <main className="flex flex-col gap-8">
            <Outlet />
          </main>

          <footer className="mt-8 flex flex-col gap-2 border-t border-border pt-8 text-xs text-body sm:flex-row sm:items-center sm:justify-between">
            <p className="font-light">
              Aegis runs entirely in your browser. No backend, no cloud
              inference.
            </p>
            <p className="stripe-kicker">v0.1 · Devnet</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
