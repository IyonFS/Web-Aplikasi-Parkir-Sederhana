import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import { getRoleLabel, getRoleMeta } from "../lib/roles";

function getNavItems({ isAdmin, isPetugas, isOwner }) {
  if (isAdmin) {
    return [
      {
        to: "/app/dashboard",
        label: "Dashboard",
        icon: "D",
        mobileLabel: "Home",
      },
      {
        to: "/app/areas",
        label: "Area Parkir",
        icon: "A",
        mobileLabel: "Area",
      },
      {
        to: "/app/tariffs",
        label: "Tarif Parkir",
        icon: "F",
        mobileLabel: "Tarif",
      },
      {
        to: "/app/vehicles",
        label: "Kendaraan",
        icon: "K",
        mobileLabel: "Kendaraan",
      },
      {
        to: "/app/slots",
        label: "Slot Parkir",
        icon: "S",
        mobileLabel: "Slot",
      },
      { to: "/app/users", label: "User", icon: "U", mobileLabel: "User" },
      {
        to: "/app/activity-logs",
        label: "Log Aktivitas",
        icon: "L",
        mobileLabel: "Log",
      },
    ];
  }

  if (isPetugas) {
    return [
      {
        to: "/app/dashboard",
        label: "Dashboard",
        icon: "D",
        mobileLabel: "Home",
      },
      {
        to: "/app/slots",
        label: "Reservasi",
        icon: "R",
        mobileLabel: "Reservasi",
      },
      {
        to: "/app/reservations",
        label: "Transaksi",
        icon: "T",
        mobileLabel: "Transaksi",
      },
    ];
  }

  return [
    {
      to: "/app/dashboard",
      label: "Dashboard",
      icon: "D",
      mobileLabel: "Home",
    },
    {
      to: "/app/analytics",
      label: "Rekap Transaksi",
      icon: "R",
      mobileLabel: "Rekap",
    },
  ];
}

function ThemeToggle({ compact = false }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className={`${compact ? "w-9 h-9 text-xs" : "w-8 h-8 text-sm"} flex items-center justify-center rounded-lg transition-all shrink-0`}
      style={{
        color: "var(--text-dim)",
        border: compact ? "1px solid var(--border)" : "none",
        background: compact ? "var(--surface)" : "transparent",
      }}
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      <span>{isDark ? "L" : "D"}</span>
    </button>
  );
}

function Sidebar({ user, navItems, connected, onLogout }) {
  const roleMeta = getRoleMeta(user?.role);

  return (
    <aside
      className="hidden md:flex w-64 flex-col shrink-0"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            P
          </div>
          <span
            className="font-display text-lg"
            style={{ color: "var(--text)" }}
          >
            Hygiopark
          </span>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: connected ? "var(--accent)" : "var(--muted)",
            boxShadow: connected ? "0 0 6px var(--accent)" : "none",
          }}
        />
      </div>

      <div
        className="px-5 py-2 text-xs"
        style={{ color: connected ? "var(--accent)" : "var(--muted)" }}
      >
        {connected ? "Sistem aktif" : "Mode offline"}
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
        <p
          className="text-xs px-3 mb-2 uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Menu Ujian
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              textDecoration: "none",
              background: isActive
                ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-dim)",
              border: `1px solid ${isActive ? "color-mix(in srgb,var(--accent) 22%,transparent)" : "transparent"}`,
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <NavLink
          to="/app/profile"
          className="block px-3 py-3 rounded-xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold"
              style={{
                background: roleMeta.bg,
                color: roleMeta.color,
                border: `1px solid ${roleMeta.border}`,
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                roleMeta.shortLabel
              )}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text)" }}
              >
                {user?.name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-dim)" }}
              >
                {getRoleLabel(user?.role)}
              </p>
            </div>
          </div>
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-2 text-xs py-2"
          style={{ color: "var(--text-dim)" }}
        >
          Keluar dari akun
        </button>
      </div>
    </aside>
  );
}

function MobileHeader({ currentLabel, connected, onMenuOpen }) {
  return (
    <header
      className="md:hidden flex items-center justify-between gap-3 px-3 py-3 sticky top-0 z-30"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          P
        </div>
        <span
          className="font-display text-base truncate max-w-[108px] sm:max-w-none"
          style={{ color: "var(--text)" }}
        >
          Hygiopark
        </span>
        {connected && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--accent)" }}
          />
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="hidden min-[390px]:inline text-[11px] max-w-[74px] truncate"
          style={{ color: "var(--text-dim)" }}
        >
          {currentLabel}
        </span>
        <ThemeToggle compact />
        <NotificationBell compact />
        <button
          type="button"
          onClick={onMenuOpen}
          className="w-9 h-9 rounded-lg text-sm font-semibold shrink-0"
          style={{
            color: "var(--text-dim)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
          title="Menu"
        >
          M
        </button>
      </div>
    </header>
  );
}

function BottomNav({ navItems }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 0",
              gap: 4,
              textDecoration: "none",
              color: isActive ? "var(--accent)" : "var(--muted)",
              position: "relative",
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isActive
                      ? "color-mix(in srgb,var(--accent) 14%,transparent)"
                      : "transparent",
                  }}
                >
                  {item.icon}
                </div>
                <span
                  style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}
                >
                  {item.mobileLabel}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function MobileDrawer({ open, onClose, user, navItems, onLogout }) {
  return (
    <>
      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              P
            </div>
            <span
              className="font-display text-lg"
              style={{ color: "var(--text)" }}
            >
              Hygiopark
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              color: "var(--muted)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            Tutup
          </button>
        </div>

        <NavLink
          to="/app/profile"
          onClick={onClose}
          className="px-4 py-4 flex items-center gap-3"
          style={{
            borderBottom: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-semibold text-sm"
            style={{
              background: "color-mix(in srgb,var(--accent) 12%,transparent)",
              color: "var(--accent)",
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]
            )}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {user?.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              {getRoleLabel(user?.role)} - Lihat profil
            </p>
          </div>
        </NavLink>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 14,
                textDecoration: "none",
                background: isActive
                  ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                  : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-dim)",
                border: `1px solid ${isActive ? "color-mix(in srgb,var(--accent) 20%,transparent)" : "transparent"}`,
              })}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div
          className="px-4 py-4"
          style={{
            borderTop: "1px solid var(--border)",
            paddingBottom: "max(16px,env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              color: "var(--danger)",
              background: "color-mix(in srgb,var(--danger) 8%,transparent)",
            }}
          >
            Keluar dari akun
          </button>
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const { user, logout, isAdmin, isPetugas, isOwner } = useAuth();
  const { connected } = useSocketContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems = getNavItems({
    isAdmin,
    isPetugas: !isAdmin && isPetugas,
    isOwner,
  });
  const current = navItems.find((item) =>
    location.pathname.startsWith(item.to),
  );
  const currentLabel =
    current?.label ||
    (location.pathname.startsWith("/app/profile") ? "Profil" : "Hygiopark");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <Sidebar
        user={user}
        navItems={navItems}
        connected={connected}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader
          currentLabel={currentLabel}
          connected={connected}
          onMenuOpen={() => setDrawerOpen(true)}
        />
        <main className="flex-1 overflow-auto pb-20 md:pb-0 flex flex-col">
          <Outlet />
        </main>
        <BottomNav navItems={navItems} />
      </div>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </div>
  );
}


