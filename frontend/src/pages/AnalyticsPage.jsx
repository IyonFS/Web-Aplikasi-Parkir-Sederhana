import { useEffect, useState } from "react";
import { analyticsService } from "../services/analytics.service";
import { formatDateLong, formatIDR, formatIDRShort } from "../lib/format";
import {
  PageHeader,
  KPICard,
  SectionCard,
  ProgressBar,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel } from "../lib/roles";

function BarChart({
  data,
  height = 140,
  valueKey = "amount",
  labelKey = "date",
  color = "var(--accent)",
}) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: data.length * 36 }}>
        <svg
          viewBox={`0 0 ${data.length * 36} ${height + 28}`}
          className="w-full"
          style={{ height: height + 28 }}
        >
          {data.map((d, i) => {
            const val = d[valueKey] || 0;
            const barH = Math.max((val / max) * height, val > 0 ? 3 : 0);
            const x = i * 36 + 3;
            const y = height - barH;
            const lbl = d[labelKey]
              ? labelKey === "date"
                ? d[labelKey].slice(5)
                : String(d[labelKey]).padStart(2, "0")
              : "";
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={28}
                  height={barH}
                  rx="5"
                  fill={color}
                  opacity={val > 0 ? 0.85 : 0.12}
                  className="transition-all duration-500"
                />
                <text
                  x={x + 14}
                  y={height + 18}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--muted)"
                  fontFamily="DM Mono, monospace"
                >
                  {lbl}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function HourHeatmap({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="grid grid-cols-12 gap-1">
      {data.map(({ hour, count }) => {
        const intensity = count / max;
        return (
          <div
            key={hour}
            title={`${String(hour).padStart(2, "0")}:00 - ${count} transaksi`}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-full aspect-square rounded-lg transition-all duration-300 hover:scale-110 cursor-default"
              style={{
                background: `color-mix(in srgb, var(--accent) ${Math.round((0.08 + intensity * 0.82) * 100)}%, transparent)`,
              }}
            />
            <span
              style={{
                fontSize: 8,
                color: "var(--muted)",
                fontFamily: "DM Mono",
              }}
            >
              {String(hour).padStart(2, "0")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const today = new Date();
const defaultEndDate = today.toISOString().slice(0, 10);
const defaultStartDate = new Date(Date.now() - 6 * 86400000)
  .toISOString()
  .slice(0, 10);

export default function AnalyticsPage() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setDateError("");
      if (new Date(startDate) > new Date(endDate)) {
        setDateError("Tanggal awal harus sebelum tanggal akhir");
        setLoading(false);
        return;
      }

      try {
        const summaryData = await analyticsService.getSummary();
        const [revenueData, peakData] = await Promise.all([
          analyticsService.getRevenue({ startDate, endDate }),
          analyticsService.getPeakHours({ startDate, endDate }),
        ]);

        setSummary(summaryData);
        setRevenue(revenueData.revenue || []);
        setPeakHours(peakData.peakHours || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [startDate, endDate]);

  const totalRevenue = revenue.reduce((sum, d) => sum + d.amount, 0);
  const peakHour = peakHours.reduce(
    (mx, d) => (d.count > (mx?.count || 0) ? d : mx),
    null,
  );
  const maxPeakCount = Math.max(...peakHours.map((d) => d.count), 1);
  const reportTitle = isAdmin
    ? "Rekap Transaksi Sistem"
    : "Rekap Transaksi Owner";

  if (loading)
    return (
      <div className="p-4 md:p-6 max-w-6xl space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl animate-pulse"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          />
        ))}
      </div>
    );

  return (
    <div className="p-4 md:p-6 w-full space-y-5">
      <PageHeader
        title="Rekap Transaksi"
        subtitle={
          isAdmin
            ? "Ringkasan pendapatan, okupansi, dan aktivitas transaksi parkir."
            : "Halaman rekap transaksi yang disiapkan untuk kebutuhan owner."
        }
        badge={getRoleLabel(user?.role)}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-ghost text-xs py-2 px-3"
            >
              Print Rekap
            </button>
          </div>
        }
      />

      <SectionCard
        title={reportTitle}
        subtitle="Bagian ini membantu menjelaskan bahwa owner dapat melihat transaksi berdasarkan rentang waktu."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span
                className="block text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--text-dim)" }}
              >
                Tanggal Awal
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input analytics-date-input"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span
                className="block text-[11px] uppercase tracking-[0.18em]"
                style={{ color: "var(--text-dim)" }}
              >
                Tanggal Akhir
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input analytics-date-input"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate(defaultStartDate);
              setEndDate(defaultEndDate);
            }}
            className="btn-ghost text-xs py-2 px-3 self-start"
          >
            Reset 7 Hari
          </button>
        </div>
        {dateError && <p className="mt-3 text-xs text-red-500">{dateError}</p>}
      </SectionCard>

      <SectionCard
        title="Ringkasan Periode"
        subtitle={`Periode: ${formatDateLong(startDate)} - ${formatDateLong(endDate)}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--text-dim)" }}
            >
              Total Pendapatan
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
              {formatIDR(totalRevenue)}
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--text-dim)" }}
            >
              Jumlah Transaksi
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
              {summary?.reservations?.total || 0} transaksi
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--text-dim)" }}
            >
              Rata-rata per Hari
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
              {revenue.length
                ? formatIDR(Math.round(totalRevenue / revenue.length))
                : formatIDR(0)}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Total Pendapatan"
          value={formatIDRShort(summary?.revenue?.total || 0)}
          icon="$"
          color="var(--accent)"
          sub="semua waktu"
          delay={0}
        />
        <KPICard
          label="Tingkat Hunian"
          value={`${summary?.slots?.occupancyRate || 0}%`}
          icon="O"
          color={
            summary?.slots?.occupancyRate > 80
              ? "var(--danger)"
              : "var(--accent)"
          }
          sub={`${summary?.slots?.occupied || 0} terisi`}
          delay={60}
        />
        <KPICard
          label="Total Transaksi"
          value={summary?.reservations?.total || 0}
          icon="T"
          color="#60a5fa"
          sub={`${summary?.reservations?.active || 0} aktif`}
          delay={120}
        />
        <KPICard
          label="Jam Tersibuk"
          value={
            peakHour ? `${String(peakHour.hour).padStart(2, "0")}:00` : "-"
          }
          icon="J"
          color="var(--warn)"
          sub={peakHour ? `${peakHour.count} transaksi` : ""}
          delay={180}
        />
      </div>

      {/* Revenue chart */}
      <SectionCard
        title="Pendapatan Harian"
        icon="$"
        subtitle={`Total: ${formatIDR(totalRevenue)}`}
        action={
          <button
            type="button"
            onClick={() => {
              setStartDate(defaultStartDate);
              setEndDate(defaultEndDate);
            }}
            className="text-xs px-2.5 py-1 rounded-lg border transition-all"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          >
            Reset 7 Hari
          </button>
        }
        delay={200}
      >
        {totalRevenue === 0 ? (
          <div
            className="h-36 flex items-center justify-center"
            style={{ color: "var(--muted)" }}
          >
            <p className="text-sm">Belum ada data pendapatan</p>
          </div>
        ) : (
          <BarChart
            data={revenue}
            height={140}
            valueKey="amount"
            labelKey="date"
          />
        )}
      </SectionCard>

      {/* 2 col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak hours */}
        <SectionCard
          title="Jam Tersibuk"
          icon="J"
          subtitle="distribusi transaksi per jam (7 hari)"
          delay={280}
        >
          {peakHours.every((d) => d.count === 0) ? (
            <div
              className="h-20 flex items-center justify-center"
              style={{ color: "var(--muted)" }}
            >
              <p className="text-sm">Belum ada data</p>
            </div>
          ) : (
            <>
              <HourHeatmap data={peakHours} />
              <div
                className="flex items-center justify-between mt-3 text-xs"
                style={{ color: "var(--text-dim)" }}
              >
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
                    }}
                  />
                  <span>Sepi</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ background: "var(--accent)" }}
                  />
                  <span>Ramai</span>
                </div>
              </div>
              {/* Top 3 jam */}
              <div className="mt-3 space-y-1.5">
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--text-dim)" }}
                >
                  Top jam tersibuk
                </p>
                {[...peakHours]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map((h, i) => (
                    <div key={h.hour} className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono w-5"
                        style={{ color: "var(--muted)" }}
                      >
                        #{i + 1}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--text)" }}
                      >
                        {String(h.hour).padStart(2, "0")}:00
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(h.count / maxPeakCount) * 100}%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {h.count}x
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Floor detail */}
        <SectionCard
          title="Detail per Lantai"
          icon="L"
          subtitle="occupancy saat ini"
          delay={320}
        >
          <div className="space-y-4">
            {summary?.byFloor &&
              Object.entries(summary.byFloor)
                .sort()
                .map(([floor, stats]) => (
                  <ProgressBar
                    key={floor}
                    label={`Lantai ${floor}`}
                    value={stats.occupied}
                    max={stats.total}
                    sub={`${stats.occupied}/${stats.total} slot terisi`}
                  />
                ))}
          </div>
        </SectionCard>
      </div>

      {/* Booking stats */}
      <SectionCard title="Ringkasan Transaksi" icon="T" delay={380}>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Aktif",
              value: summary?.reservations?.active || 0,
              color: "var(--accent)",
            },
            {
              label: "Dibatalkan",
              value: summary?.reservations?.cancelled || 0,
              color: "var(--danger)",
            },
            {
              label: "Total",
              value: summary?.reservations?.total || 0,
              color: "var(--text)",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-5 rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="font-display text-3xl mb-1"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

