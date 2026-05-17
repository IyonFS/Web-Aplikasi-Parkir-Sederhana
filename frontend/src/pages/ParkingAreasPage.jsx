import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lotsService } from "../services/lots.service";
import { slotsService } from "../services/slots.service";
import { usersService } from "../services/users.service";
import { PageHeader, SectionCard, Toast, RoleBadge } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "",
  address: "",
  operatorId: "",
  totalSlots: 0,
  mapsLink: "",
  isActive: true,
};

function buildMapsLink(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined || latitude === "" || longitude === "") {
    return "";
  }
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function parseMapsLink(link) {
  if (!link?.trim()) return { latitude: "", longitude: "" };
  const value = link.trim();

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return { latitude: match[1], longitude: match[2] };
    }
  }

  return { latitude: "", longitude: "" };
}

export default function ParkingAreasPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState([]);
  const [slotRecords, setSlotRecords] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lotsData, operatorsData, slotsData] = await Promise.all([
        lotsService.list(),
        usersService.list({ role: "operator", limit: 100 }),
        slotsService.list(),
      ]);
      setLots(lotsData.lots || []);
      setOperators(operatorsData.users || []);
      setSlotRecords(slotsData.slots || []);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal memuat area parkir",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const slotInsights = useMemo(() => {
    return slotRecords.reduce((acc, slot) => {
      const current = acc[slot.lotId] || {
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
        floors: new Set(),
      };

      current.total += 1;
      current.floors.add(slot.floor);
      if (slot.status === "available") current.available += 1;
      if (slot.status === "occupied") current.occupied += 1;
      if (slot.status === "maintenance") current.maintenance += 1;
      acc[slot.lotId] = current;
      return acc;
    }, {});
  }, [slotRecords]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: lots.length,
      aktif: lots.filter((lot) => lot.isActive).length,
      nonaktif: lots.filter((lot) => !lot.isActive).length,
      slotTercatat: lots.reduce((sum, lot) => sum + (lot.totalSlots || 0), 0),
    }),
    [lots],
  );

  const openSlotsFlow = (lot, viewMode = "grid") => {
    navigate("/app/slots", {
      state: {
        lotId: lot.id,
        viewMode,
        sourceLotName: lot.name,
      },
    });
  };

  const startCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (lot) => {
    setSelected(lot);
    setForm({
      name: lot.name || "",
      address: lot.address || "",
      operatorId: lot.operatorId || "",
      totalSlots: lot.totalSlots || 0,
      mapsLink: buildMapsLink(lot.latitude, lot.longitude),
      isActive: lot.isActive,
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const coordinates = parseMapsLink(form.mapsLink);
      const payload = {
        name: form.name,
        address: form.address,
        operatorId: form.operatorId,
        totalSlots: form.totalSlots,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isActive: form.isActive,
      };

      if (selected?.id) {
        await lotsService.update(selected.id, payload);
        showToast("Area parkir berhasil diperbarui");
      } else {
        await lotsService.create(payload);
        showToast("Area parkir berhasil ditambahkan");
      }
      setSelected(null);
      setForm(EMPTY_FORM);
      load();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal menyimpan area parkir",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const archiveLot = async (lot) => {
    try {
      await lotsService.remove(lot.id);
      showToast("Area parkir dinonaktifkan");
      if (selected?.id === lot.id) {
        setSelected(null);
        setForm(EMPTY_FORM);
      }
      load();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal menonaktifkan area parkir",
        "error",
      );
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-7 w-full max-w-none space-y-5">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Area Parkir"
        subtitle="Modul admin untuk menambah, mengubah, dan menonaktifkan area parkir."
        badge="Admin"
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={startCreate}
          >
            Tambah Area
          </button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Area", value: stats.total, tone: "var(--accent)" },
          { label: "Area Aktif", value: stats.aktif, tone: "#60a5fa" },
          {
            label: "Area Nonaktif",
            value: stats.nonaktif,
            tone: "var(--warn)",
          },
          { label: "Total Slot", value: stats.slotTercatat, tone: "#f59e0b" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] p-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: item.tone }}
            >
              {item.label}
            </p>
            <p
              className="font-display text-3xl mt-3"
              style={{ color: "var(--text)" }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_380px] gap-4 items-start">
        <SectionCard
          title="Daftar Area Parkir"
          subtitle="Digunakan admin untuk mengelola area, alamat, dan penanggung jawab."
        >
          <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-auto pr-2">
            {loading ? (
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl animate-pulse"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))
            ) : lots.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                Belum ada area parkir. Tambahkan area pertama agar struktur
                modul ujian lebih lengkap.
              </div>
            ) : (
              lots.map((lot) => (
                (() => {
                  const insight = slotInsights[lot.id] || {
                    total: 0,
                    available: 0,
                    occupied: 0,
                    maintenance: 0,
                    floors: new Set(),
                  };

                  return (
                <div
                  key={lot.id}
                  className="rounded-[24px] p-4 transition-all"
                  style={{
                    background:
                      selected?.id === lot.id
                        ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                        : "var(--surface)",
                    border: `1px solid ${selected?.id === lot.id ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            color: lot.isActive
                              ? "var(--accent)"
                              : "var(--warn)",
                            background: lot.isActive
                              ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                              : "color-mix(in srgb, var(--warn) 10%, transparent)",
                            border: `1px solid ${lot.isActive ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "color-mix(in srgb, var(--warn) 20%, transparent)"}`,
                          }}
                        >
                          {lot.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            color: "#60a5fa",
                            background:
                              "color-mix(in srgb, #60a5fa 10%, transparent)",
                            border:
                              "1px solid color-mix(in srgb, #60a5fa 20%, transparent)",
                          }}
                        >
                          {lot._count?.slots || 0} slot terhubung
                        </span>
                      </div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {lot.name}
                      </h3>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {lot.address}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap mt-3 text-xs" style={{ color: "var(--text-dim)" }}>
                        <span>Total slot: {lot.totalSlots || 0}</span>
                        <span>
                          Operator: {lot.operator?.name || "Belum ditetapkan"}
                        </span>
                        <span>
                          Lantai aktif: {insight.floors.size ? Array.from(insight.floors).sort().join(", ") : "Belum ada"}
                        </span>
                        {(lot.latitude || lot.longitude) && (
                          <a
                            href={buildMapsLink(lot.latitude, lot.longitude)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#60a5fa" }}
                          >
                            Buka Maps
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {[
                          { label: "Slot aktif", value: insight.total, color: "var(--text)" },
                          { label: "Tersedia", value: insight.available, color: "var(--accent)" },
                          { label: "Terisi", value: insight.occupied, color: "var(--danger)" },
                          { label: "Perawatan", value: insight.maintenance, color: "var(--warn)" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl px-3 py-2.5"
                            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                          >
                            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                              {item.label}
                            </p>
                            <p className="text-base font-semibold mt-1" style={{ color: item.color }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                          color: "var(--accent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                        }}
                        onClick={() => openSlotsFlow(lot)}
                      >
                        Kelola Slot
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: "color-mix(in srgb, #60a5fa 10%, transparent)",
                          color: "#60a5fa",
                          border: "1px solid color-mix(in srgb, #60a5fa 20%, transparent)",
                        }}
                        onClick={() => openSlotsFlow(lot, "denah")}
                      >
                        Buka Denah
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{
                          background:
                            "color-mix(in srgb, #60a5fa 10%, transparent)",
                          color: "#60a5fa",
                          border:
                            "1px solid color-mix(in srgb, #60a5fa 20%, transparent)",
                        }}
                        onClick={() => startEdit(lot)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{
                          background:
                            "color-mix(in srgb, var(--danger) 10%, transparent)",
                          color: "var(--danger)",
                          border:
                            "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                        }}
                        onClick={() => setConfirmDelete(lot)}
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </div>
                </div>
                  );
                })()
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={selected ? "Edit Area" : "Form Area Baru"}
          subtitle="Isi data inti area parkir untuk keperluan modul admin."
        >
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="label">Nama Area</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Contoh: Gedung A"
              />
            </div>
            <div>
              <label className="label">Alamat</label>
              <textarea
                className="input min-h-[96px]"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Masukkan alamat area parkir"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Petugas Penanggung Jawab</label>
                <select
                  className="input"
                  value={form.operatorId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, operatorId: e.target.value }))
                  }
                >
                  <option value="">Belum ditetapkan</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Total Slot</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.totalSlots}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalSlots: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="label">Link Google Maps</label>
              <input
                className="input"
                value={form.mapsLink}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mapsLink: e.target.value }))
                }
                placeholder="Tempel link Google Maps lokasi area parkir"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                Sistem akan mengambil koordinat otomatis dari link Google Maps.
              </p>
            </div>
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text)" }}
            >
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              Area aktif
            </label>

            {selected?.operator && (
              <div
                className="rounded-2xl p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-dim)" }}
                >
                  Penanggung Jawab Saat Ini
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <RoleBadge role="operator" />
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    {selected.operator.name}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : selected
                    ? "Simpan Perubahan"
                    : "Tambah Area"}
              </button>
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={startCreate}
              >
                Reset
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          title={`Nonaktifkan area ${confirmDelete.name}?`}
          description="Aksi ini akan menandai area parkir sebagai nonaktif. Data tidak dihapus permanen agar aman untuk presentasi dan audit."
          confirmLabel="Ya, nonaktifkan"
          cancelLabel="Batal"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const target = confirmDelete;
            setConfirmDelete(null);
            await archiveLot(target);
          }}
        />
      )}
    </div>
  );
}

