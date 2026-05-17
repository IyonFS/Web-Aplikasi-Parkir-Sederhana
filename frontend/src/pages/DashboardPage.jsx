import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { analyticsService } from "../services/analytics.service";
import { useAuth } from "../context/AuthContext";
import { useSocketEvents } from "../hooks/useSocket";
import { formatIDRShort, formatIDR, formatDateShort } from "../lib/format";
import {
  PageHeader,
  KPICard,
  SectionCard,
  EmptyState,
  StatusDot,
  Avatar,
  SkeletonCard,
  Toast,
} from "../components/ui";

function AdminDashboard({ data, liveEvents, user }) {
  const navigate = useNavigate();
  const floorEntries = Object.entries(data.byFloor || {}).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user?.name?.split(" ")[0]}`}
        subtitle="Dashboard admin difokuskan ke master data, kontrol operasional, dan kondisi parkir yang benar-benar dipakai."
        badge="Admin"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/app/users")}
              className="btn-ghost"
            >
              Kelola User
            </button>
            <button
              onClick={() => navigate("/app/areas")}
              className="btn-primary"
            >
              Kelola Area
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          label="Slot Aktif"
          value={data.slots.total}
          icon="S"
          color="var(--accent)"
          sub={`${data.slots.available} tersedia`}
          delay={0}
        />
        <KPICard
          label="Hunian"
          value={`${data.slots.occupancyRate}%`}
          icon="O"
          color={
            data.slots.occupancyRate > 80 ? "var(--danger)" : "var(--warn)"
          }
          sub={`${data.slots.occupied} slot terisi`}
          delay={60}
        />
        <KPICard
          label="Transaksi"
          value={data.reservations.total}
          icon="T"
          color="#60a5fa"
          sub={`${data.reservations.active} aktif`}
          delay={120}
        />
        <KPICard
          label="Pendapatan"
          value={formatIDRShort(data.revenue.total)}
          icon="$"
          color="#f59e0b"
          sub="akumulasi saat ini"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <SectionCard
          title="Kontrol Admin"
          icon="A"
          subtitle="Akses cepat ke modul inti yang paling sering dipakai."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: "Area Parkir",
                desc: "Atur area, alamat, petugas, dan kapasitas dasar.",
                action: () => navigate("/app/areas"),
                tone: "#60a5fa",
              },
              {
                label: "Slot Parkir",
                desc: "Kelola slot, tipe, dan status operasional.",
                action: () => navigate("/app/slots"),
                tone: "var(--accent)",
              },
              {
                label: "Tarif Parkir",
                desc: "Samakan tarif dengan jenis kendaraan yang aktif.",
                action: () => navigate("/app/tariffs"),
                tone: "#f59e0b",
              },
              {
                label: "Kendaraan",
                desc: "Pastikan data kendaraan owner tersimpan rapi.",
                action: () => navigate("/app/vehicles"),
                tone: "var(--warn)",
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: item.tone }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Buka modul
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Kondisi Parkir"
          icon="F"
          subtitle="Ringkasan okupansi per lantai dalam format yang lebih ringkas."
        >
          <div className="space-y-3">
            {floorEntries.map(([floor, stats]) => (
              <button
                key={floor}
                onClick={() => navigate(`/app/slots?floor=${floor}`)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-bold" style={{ color: "var(--accent)" }}>
                    Lantai {floor}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {stats.total - stats.occupied} kosong
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((stats.occupied / stats.total) * 100)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {stats.occupied}/{stats.total} slot terisi
                </p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Aktivitas Terbaru"
        icon="L"
        subtitle="Update perubahan slot dan transaksi terbaru."
        noPadding
      >
        {!liveEvents.length ? (
          <div className="p-5">
            <EmptyState icon="L" title="Belum ada aktivitas terbaru" />
          </div>
        ) : (
          <div>
            {liveEvents.map((event, index) => (
              <div
                key={`${event.time}-${index}`}
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  borderBottom:
                    index < liveEvents.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--muted)" }}
                >
                  {event.time}
                </span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {event.msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function PetugasDashboard({ data, liveEvents, user }) {
  const navigate = useNavigate();
  const activeReservations = (data.recentActivity || [])
    .filter((item) => item.status === "active")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${user?.name?.split(" ")[0]}`}
        subtitle="Panel petugas untuk memproses transaksi parkir, memantau slot, dan menyiapkan struk parkir."
        badge="Petugas"
        action={
          <button
            onClick={() => navigate("/app/reservations")}
            className="btn-primary text-xs py-2 px-3"
          >
            Buka Transaksi
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          label="Slot Tersedia"
          value={data.slots.available}
          icon="S"
          color="var(--accent)"
          sub={`${data.slots.total} total`}
          delay={0}
        />
        <KPICard
          label="Sedang Terisi"
          value={data.slots.occupied}
          icon="O"
          color="var(--danger)"
          sub={`${data.slots.occupancyRate}% hunian`}
          delay={60}
        />
        <KPICard
          label="Transaksi Aktif"
          value={data.reservations.active}
          icon="T"
          color="#60a5fa"
          sub="perlu dipantau"
          delay={120}
        />
        <KPICard
          label="Pemasukan"
          value={formatIDRShort(data.revenue.total)}
          icon="$"
          color="var(--warn)"
          sub="hari ini"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <SectionCard
          title="Daftar Transaksi Aktif"
          icon="T"
          subtitle="Slot yang sedang berlangsung dan siap dicetak struknya."
        >
          {!activeReservations.length ? (
            <EmptyState
              icon="T"
              title="Belum ada transaksi aktif"
              subtitle="Saat ada kendaraan yang sedang parkir, daftar singkatnya akan muncul di sini."
            />
          ) : (
            <div className="space-y-3">
              {activeReservations.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
                  style={{
                    background:
                      index === 0
                        ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                        : "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                  >
                  <div
                    className="min-w-[56px] h-12 px-2 rounded-2xl flex items-center justify-center font-mono text-base font-bold shrink-0"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
                      color: "var(--accent)",
                      border:
                        "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                    }}
                  >
                    <span className="leading-none whitespace-nowrap">
                      {item.slotNumber}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p
                          className="text-base font-mono font-semibold truncate"
                          style={{ color: "var(--text)" }}
                        >
                          {item.vehiclePlate}
                        </p>
                        {item.slot?.lot?.name && (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs"
                            style={{
                              background:
                                "color-mix(in srgb, #60a5fa 10%, transparent)",
                              color: "#60a5fa",
                              border:
                                "1px solid color-mix(in srgb, #60a5fa 18%, transparent)",
                            }}
                          >
                            {item.slot.lot.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-sm">
                        <span style={{ color: "var(--text-dim)" }}>
                          {item.user?.name || item.userName}
                        </span>
                        <span style={{ color: "var(--muted)" }}>•</span>
                        <span style={{ color: "var(--text-dim)" }}>
                          Mulai {formatDateShort(item.startTime)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <StatusDot status={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Lapangan"
          icon="L"
          subtitle="Perubahan slot dan transaksi tampil otomatis."
        >
          {!liveEvents.length ? (
            <EmptyState
              icon="L"
              title="Menunggu aktivitas"
              subtitle="Saat ada perubahan transaksi, daftar ini akan terisi."
            />
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-auto pr-2">
              {liveEvents.map((event, index) => (
                <div
                  key={`${event.time}-${index}`}
                  className="rounded-xl p-3 text-xs flex items-start gap-2.5"
                  style={{
                    background:
                      index === 0
                        ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                        : "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono shrink-0"
                    style={{ color: "var(--muted)" }}
                  >
                    {event.time}
                  </span>
                  <span
                    style={{
                      color: index === 0 ? "var(--accent)" : "var(--text-dim)",
                    }}
                  >
                    {event.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function OwnerDashboard({ data, user }) {
  const navigate = useNavigate();
  const latest = (data.recentActivity || []).slice(0, 5);
  const floorEntries = Object.entries(data.byFloor || {}).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${user?.name?.split(" ")[0]}`}
        subtitle="Panel owner difokuskan ke rekap transaksi, ringkasan pendapatan, dan kondisi umum parkir."
        badge="Owner"
        action={
          <button
            onClick={() => navigate("/app/analytics")}
            className="btn-primary text-xs py-2 px-3"
          >
            Buka Rekap
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          label="Total Transaksi"
          value={data.reservations.total}
          icon="T"
          color="#60a5fa"
          sub={`${data.reservations.active} masih aktif`}
          delay={0}
        />
        <KPICard
          label="Pendapatan"
          value={formatIDRShort(data.revenue.total)}
          icon="$"
          color="#f59e0b"
          sub="akumulasi saat ini"
          delay={60}
        />
        <KPICard
          label="Slot Tersedia"
          value={data.slots.available}
          icon="S"
          color="var(--accent)"
          sub={`${data.slots.total} total`}
          delay={120}
        />
        <KPICard
          label="Hunian"
          value={`${data.slots.occupancyRate}%`}
          icon="O"
          color={
            data.slots.occupancyRate > 80 ? "var(--danger)" : "var(--warn)"
          }
          sub="semua lantai"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <SectionCard
          title="Ringkasan Rekap"
          icon="R"
          subtitle="Data yang paling relevan untuk owner saat presentasi."
        >
          <div className="space-y-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "#f59e0b" }}
              >
                Pendapatan
              </p>
              <p
                className="font-display text-3xl mt-2"
                style={{ color: "#f59e0b" }}
              >
                {formatIDR(data.revenue.total)}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                Nilai ini berasal dari transaksi parkir yang sudah tercatat
                dalam sistem.
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--accent)" }}
              >
                Status Parkir
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--text)" }}>
                Saat ini tersedia {data.slots.available} slot dari total{" "}
                {data.slots.total} slot aktif.
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "#60a5fa" }}
              >
                Tindak lanjut
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--text)" }}>
                Halaman ini akan kita lanjutkan menjadi rekap transaksi sesuai
                rentang waktu, sesuai tuntutan modul ujian.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Kondisi Per Lantai"
          icon="F"
          subtitle="Ringkas dan mudah dijelaskan ke penguji."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {floorEntries.map(([floor, stats]) => (
              <div
                key={floor}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    Lantai {floor}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {stats.total - stats.occupied} kosong
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden mb-2"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((stats.occupied / stats.total) * 100)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {stats.occupied}/{stats.total} slot terisi
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Transaksi Terbaru"
        icon="L"
        subtitle="Contoh data transaksi yang bisa dijadikan bahan demo."
        noPadding
      >
        {!latest.length ? (
          <div className="p-5">
            <EmptyState icon="L" title="Belum ada transaksi" />
          </div>
        ) : (
          <div>
            {latest.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3"
                style={{
                  borderBottom:
                    index < latest.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <Avatar
                  name={item.user?.name || item.userName}
                  role="user"
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {item.user?.name || item.userName}
                  </p>
                  <p
                    className="text-xs font-mono truncate"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Slot {item.slotNumber} - {item.vehiclePlate}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-sm font-mono font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    {formatIDR(item.totalAmount)}
                  </p>
                  <StatusDot status={item.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, isPetugas } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveEvents, setLiveEvents] = useState([]);
  const [toast, setToast] = useState(null);

  const load = () => {
    analyticsService
      .getSummary()
      .then(setData)
      .catch((err) =>
        setError(err.response?.data?.error || "Gagal memuat dashboard"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useSocketEvents({
    "summary:updated": (summary) =>
      setData((prev) => (prev ? { ...prev, ...summary } : prev)),
    "slot:updated": (slot) =>
      addLive(
        `Slot ${slot.number} - ${slot.status === "available" ? "tersedia" : slot.status === "occupied" ? "terisi" : "perawatan"}`,
      ),
    "reservation:created": (reservation) => {
      addLive(
        `Transaksi baru: Slot ${reservation.slotNumber} - ${reservation.vehiclePlate}`,
      );
      load();
    },
    "reservation:cancelled": (reservation) =>
      addLive(`Transaksi dibatalkan: Slot ${reservation.slotNumber}`),
  });

  function addLive(msg) {
    setLiveEvents((prev) => [
      {
        msg,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev.slice(0, 7),
    ]);
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div
          className="px-5 py-4 rounded-2xl text-sm"
          style={{
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-7 w-full max-w-none">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {isAdmin && (
        <AdminDashboard data={data} liveEvents={liveEvents} user={user} />
      )}
      {!isAdmin && isPetugas && (
        <PetugasDashboard data={data} liveEvents={liveEvents} user={user} />
      )}
      {!isAdmin && !isPetugas && <OwnerDashboard data={data} user={user} />}
    </div>
  );
}

