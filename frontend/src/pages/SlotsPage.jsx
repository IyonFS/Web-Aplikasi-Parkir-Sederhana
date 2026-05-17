import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { slotsService } from "../services/slots.service";
import { lotsService } from "../services/lots.service";
import { useAuth } from "../context/AuthContext";
import { useSocketEvent } from "../hooks/useSocket";
import { PageHeader, SectionCard, Toast } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";
import SlotFormModal from "../components/SlotFormModal";
import FloorMap from "../components/FloorMap";
import ReserveModal from "../components/ReserveModal";
import QRTicketModal from "../components/QRTicketModal";
import SlotCard from "../components/SlotCard";

const SLOT_TYPE_LABELS = {
  standard: "Standar",
  ev: "EV Charging",
  disabled: "Difabel",
};

const SLOT_STATUS_LABELS = {
  available: "Tersedia",
  occupied: "Terisi",
  maintenance: "Maintenance",
};

export default function SlotsPage() {
  const location = useLocation();
  const { isAdmin, isOperator } = useAuth();
  const isOperatorOnly = isOperator && !isAdmin;
  const [slots, setSlots] = useState([]);
  const [lots, setLots] = useState([]);
  const [lotCatalog, setLotCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("available");
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [ticketTarget, setTicketTarget] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [lotFilter, setLotFilter] = useState(() => (isOperatorOnly ? "" : "all"));
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!location.state) return;

    if (location.state.lotId) setLotFilter(location.state.lotId);
    if (location.state.viewMode) setViewMode(location.state.viewMode);
    if (location.state.floor) setFloorFilter(location.state.floor);
    if (location.state.search) setSearch(location.state.search);
  }, [location.state]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (lotFilter && lotFilter !== "all") params.lotId = lotFilter;
      if (floorFilter !== "all") params.floor = floorFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await slotsService.list(params);
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat slot");
    } finally {
      setLoading(false);
    }
  }, [search, lotFilter, floorFilter, typeFilter, statusFilter]);

  const loadLots = useCallback(async () => {
    try {
      const data = await lotsService.list();
      const fetchedLots = data.lots || [];
      setLots(fetchedLots);
      setLotCatalog((prev) => {
        const lotMap = new Map(prev.map((lot) => [lot.id, lot]));
        fetchedLots
          .filter((lot) => lot?.id && lot.isActive !== false)
          .forEach((lot) => {
            lotMap.set(lot.id, lot);
          });
        return Array.from(lotMap.values()).sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
      });
    } catch (err) {
      console.error("Failed to load lots:", err);
    }
  }, []);

  useEffect(() => {
    loadSlots();
    loadLots();
  }, [loadSlots, loadLots]);

  useSocketEvent("slot:updated", (updatedSlot) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? { ...s, ...updatedSlot } : s)),
    );
    if (selectedSlot?.id === updatedSlot.id) {
      setSelectedSlot((prev) => ({ ...prev, ...updatedSlot }));
    }
  });

  useEffect(() => {
    if (!slots.length) return;

    setLotCatalog((prev) => {
      const lotMap = new Map(prev.map((lot) => [lot.id, lot]));
      slots.forEach((slot) => {
        if (!slot?.lotId || !slot?.lot) return;
        if (!lotMap.has(slot.lotId)) {
          lotMap.set(slot.lotId, {
            id: slot.lotId,
            name: slot.lot.name || "Area Parkir",
            address: slot.lot.address || "",
            isActive: true,
          });
        }
      });
      return Array.from(lotMap.values()).sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    });
  }, [slots]);

  const handleDeleteSlot = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await slotsService.delete(confirmDelete.id);
      showToast("Slot berhasil dihapus");
      setSelectedSlot(null);
      setConfirmDelete(null);
      loadSlots();
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal menghapus slot", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEditForm = (slot) => {
    setEditingSlot(slot);
    setShowSlotForm(true);
  };

  const handleStatusChange = async (id, status) => {
    setStatusSaving(true);
    try {
      await slotsService.updateStatus(id, status);
      showToast("Status slot berhasil diperbarui");
      setSelectedSlot((prev) => (prev ? { ...prev, status } : prev));
      loadSlots();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Gagal memperbarui status",
        "error",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSuccess = () => {
    setEditingSlot(null);
    loadSlots();
  };

  const handleReserveSuccess = (reservation) => {
    setReserveTarget(null);
    setTicketTarget(reservation);
    setShowTicketModal(true);
    showToast("Reservasi berhasil dibuat. QR tiket sudah tersedia.");
    loadSlots();
  };

  useEffect(() => {
    setSelectedStatus(selectedSlot?.status || "available");
  }, [selectedSlot]);

  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === "available").length,
    occupied: slots.filter((s) => s.status === "occupied").length,
    maintenance: slots.filter((s) => s.status === "maintenance").length,
  };

  const filteredSlots = slots.filter((slot) => {
    if (search) {
      const searchable = [
        slot.number,
        slot.floor,
        slot.lot?.name,
        SLOT_TYPE_LABELS[slot.type],
        SLOT_STATUS_LABELS[slot.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search.toLowerCase())) {
        return false;
      }
    }
    if (lotFilter && lotFilter !== "all" && slot.lotId !== lotFilter) return false;
    if (floorFilter !== "all" && slot.floor !== floorFilter) return false;
    if (typeFilter !== "all" && slot.type !== typeFilter) return false;
    if (statusFilter !== "all" && slot.status !== statusFilter) return false;
    return true;
  });

  const floors = [...new Set(slots.map((s) => s.floor))].sort();
  const availableLots = lotCatalog;

  const selectedLotMeta = lotFilter && lotFilter !== "all"
    ? availableLots.find((lot) => lot.id === lotFilter) || null
    : null;
  const selectedLotInsight = useMemo(() => {
    if (!selectedLotMeta) return null;

    const lotSlots = slots.filter((slot) => slot.lotId === selectedLotMeta.id);
    const floorSummary = [...new Set(lotSlots.map((slot) => slot.floor))].sort();

    return {
      total: lotSlots.length,
      available: lotSlots.filter((slot) => slot.status === "available").length,
      occupied: lotSlots.filter((slot) => slot.status === "occupied").length,
      maintenance: lotSlots.filter((slot) => slot.status === "maintenance").length,
      floors: floorSummary,
    };
  }, [selectedLotMeta, slots]);
  const operatorHighlights = [
    {
      label: "tersedia",
      value: stats.available,
      color: "var(--accent)",
      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
      border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
    },
    {
      label: "terisi",
      value: stats.occupied,
      color: "var(--danger)",
      background: "color-mix(in srgb, var(--danger) 10%, transparent)",
      border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
    },
    {
      label: "total",
      value: stats.total,
      color: "var(--text-dim)",
      background: "color-mix(in srgb, var(--text-dim) 8%, transparent)",
      border: "1px solid var(--border)",
    },
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const quickSearchMatches = normalizedSearch
    ? slots
        .filter((slot) => {
          const searchable = [
            slot.number,
            slot.floor,
            slot.lot?.name,
            SLOT_TYPE_LABELS[slot.type],
            SLOT_STATUS_LABELS[slot.status],
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(normalizedSearch);
        })
        .slice(0, 4)
    : [];
  const shouldChooseLotFirst = isOperatorOnly && !lotFilter;

  const groupedSlotsByLot = useMemo(() => {
    const groups = filteredSlots.reduce((acc, slot) => {
      const key = slot.lotId || "unassigned";
      if (!acc[key]) {
        acc[key] = {
          lotId: slot.lotId || null,
          lotName: slot.lot?.name || "Area tanpa nama",
          lotAddress: slot.lot?.address || "",
          slots: [],
        };
      }
      acc[key].slots.push(slot);
      return acc;
    }, {});

    return Object.values(groups)
      .map((group) => ({
        ...group,
        available: group.slots.filter((slot) => slot.status === "available").length,
        occupied: group.slots.filter((slot) => slot.status === "occupied").length,
        maintenance: group.slots.filter((slot) => slot.status === "maintenance").length,
        floors: [...new Set(group.slots.map((slot) => slot.floor))].sort(),
      }))
      .sort((a, b) => a.lotName.localeCompare(b.lotName));
  }, [filteredSlots]);
  const showInlineAreaHeader = !selectedLotMeta;

  const focusSlotFromSearch = (slot) => {
    setSearch(slot.number);
    setLotFilter(slot.lotId || "all");
    setFloorFilter(slot.floor);
    setSelectedSlot(slot);
    setViewMode("denah");
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

      {!isOperatorOnly && (
        <>
          <PageHeader
            title={isAdmin ? "Kelola Slot Parkir" : "Slot Parkir"}
            subtitle={
              isAdmin
                ? "Daftar slot parkir di sistem Hygiopark"
                : "Lihat detail slot tanpa mengubah konfigurasi"
            }
            badge={isAdmin ? "Admin" : "Owner"}
            action={
              isAdmin && (
                <button
                  type="button"
                  className="btn-primary text-sm py-3 px-4"
                  onClick={() => {
                    setEditingSlot(null);
                    setShowSlotForm(true);
                  }}
                >
                  Tambah Slot
                </button>
              )
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Slot", value: stats.total, color: "var(--text)" },
              { label: "Tersedia", value: stats.available, color: "var(--accent)" },
              { label: "Terisi", value: stats.occupied, color: "var(--danger)" },
              {
                label: "Maintenance",
                value: stats.maintenance,
                color: "var(--warn)",
              },
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
                  style={{ color: item.color }}
                >
                  {item.label}
                </p>
                <p
                  className="font-display text-2xl mt-3"
                  style={{ color: "var(--text)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 min-w-0">
              <input
                type="search"
                className="input w-full"
                placeholder="Cari nomor slot, lantai, atau area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-40">
                <label className="text-xs font-medium text-slate-500">Area</label>
                <select
                  value={lotFilter}
                  onChange={(e) => setLotFilter(e.target.value)}
                  className="input w-full mt-1"
                >
                  <option value="all">Semua Area</option>
                  {availableLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-slate-500">Lantai</label>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="input w-full mt-1"
                >
                  <option value="all">Semua</option>
                  {floors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-slate-500">Tipe</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input w-full mt-1"
                >
                  <option value="all">Semua</option>
                  <option value="standard">Standar</option>
                  <option value="ev">EV</option>
                  <option value="disabled">Difabel</option>
                </select>
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input w-full mt-1"
                >
                  <option value="all">Semua</option>
                  <option value="available">Tersedia</option>
                  <option value="occupied">Terisi</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {selectedLotMeta && selectedLotInsight && (
            <div
              className="rounded-[24px] p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                    Area Terpilih
                  </p>
                  <h3 className="text-xl font-semibold mt-2" style={{ color: "var(--text)" }}>
                    {selectedLotMeta.name}
                  </h3>
                  <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-dim)" }}>
                    {selectedLotMeta.address}
                  </p>
                  <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
                    Lantai terhubung: {selectedLotInsight.floors.length ? selectedLotInsight.floors.join(", ") : "Belum ada slot"}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Slot aktif", value: selectedLotInsight.total, color: "var(--text)" },
                    { label: "Tersedia", value: selectedLotInsight.available, color: "var(--accent)" },
                    { label: "Terisi", value: selectedLotInsight.occupied, color: "var(--danger)" },
                    { label: "Perawatan", value: selectedLotInsight.maintenance, color: "var(--warn)" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl px-3 py-2.5 min-w-[108px]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                        {item.label}
                      </p>
                      <p className="text-lg font-semibold mt-1" style={{ color: item.color }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isOperatorOnly ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-3xl" style={{ color: "var(--text)" }}>
                  Slot Parkir
                </h2>
                {operatorHighlights.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      color: item.color,
                      background: item.background,
                      border: item.border,
                    }}
                  >
                    <span>{item.value}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </span>
                ))}
                <span className="text-sm" style={{ color: "var(--accent-dim)" }}>
                  live
                </span>
              </div>
              <p className="text-sm max-w-2xl" style={{ color: "var(--text-dim)" }}>
                Pilih slot yang tersedia, ganti mode tampilan sesuai kebutuhan petugas, dan buat reservasi langsung dari satu layar.
              </p>
            </div>

            <div
              className="inline-flex rounded-2xl p-1 self-start"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {[
                { key: "grid", label: "Grid" },
                { key: "denah", label: "Denah" },
              ].map((mode) => {
                const active = viewMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setViewMode(mode.key)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "#06221e" : "var(--text-dim)",
                      boxShadow: active
                        ? "0 10px 24px color-mix(in srgb, var(--accent) 24%, transparent)"
                        : "none",
                    }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,0.45fr))]">
            <div className="space-y-2">
              <label className="label">Pencarian Cepat</label>
              <div className="flex gap-2">
                <input
                  type="search"
                  className="input w-full"
                  placeholder="Cari slot, lantai, area, atau tipe"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="px-4 rounded-2xl text-sm font-semibold transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-dim)",
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
              {search && (
                <div className="flex flex-wrap gap-2">
                  {quickSearchMatches.length > 0 ? (
                    quickSearchMatches.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => focusSlotFromSearch(slot)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
                          color: "var(--accent)",
                        }}
                      >
                        {slot.number} · {slot.lot?.name || "Area"} · Lt. {slot.floor}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                      Tidak ada hasil cepat untuk kata kunci itu.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Area Parkir</label>
              <select
                value={lotFilter}
                onChange={(e) => setLotFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">Pilih Area Parkir</option>
                {availableLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lantai</label>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Semua Lantai</option>
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    Lantai {floor}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipe</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Semua Tipe</option>
                <option value="standard">Standar</option>
                <option value="ev">EV Charging</option>
                <option value="disabled">Difabel</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="occupied">Terisi</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {selectedLotMeta && selectedLotInsight && (
            <div
              className="rounded-[24px] p-4 md:p-5"
              style={{
                background: "linear-gradient(145deg, color-mix(in srgb, var(--accent) 8%, transparent), color-mix(in srgb, #60a5fa 6%, transparent), transparent 74%)",
                border: "1px solid color-mix(in srgb, var(--accent) 16%, transparent)",
              }}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                    Area Reservasi Aktif
                  </p>
                  <h3 className="text-xl font-semibold mt-2" style={{ color: "var(--text)" }}>
                    {selectedLotMeta.name}
                  </h3>
                  <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-dim)" }}>
                    {selectedLotMeta.address}
                  </p>
                  <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
                    Denah dan reservasi sekarang difokuskan ke area ini agar alur petugas lebih jelas.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Slot area", value: selectedLotInsight.total, color: "var(--text)" },
                    { label: "Siap reservasi", value: selectedLotInsight.available, color: "var(--accent)" },
                    { label: "Sedang terpakai", value: selectedLotInsight.occupied, color: "var(--danger)" },
                    { label: "Lantai", value: selectedLotInsight.floors.length, color: "#60a5fa" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl px-3 py-2.5 min-w-[108px]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                        {item.label}
                      </p>
                      <p className="text-lg font-semibold mt-1" style={{ color: item.color }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {((lotFilter && lotFilter !== "all") || floorFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-dim)" }}>
                <span>Menampilkan:</span>
                {lotFilter && lotFilter !== "all" && (
                  <span className="px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    {availableLots.find((lot) => lot.id === lotFilter)?.name || "Area"}
                  </span>
                )}
                {floorFilter !== "all" && (
                  <span className="px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    Lantai {floorFilter}
                  </span>
                )}
              </div>
            )}

            {ticketTarget && (
              <div
                className="rounded-[24px] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent) 8%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Tiket untuk slot {ticketTarget.slotNumber} sudah siap.
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    Buka kembali QR tiket kapan saja dari panel ini.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowTicketModal(true)}
                >
                  Buka QR Ticket
                </button>
              </div>
            )}

            {shouldChooseLotFirst ? (
              <div
                className="rounded-[24px] p-8 text-center space-y-3"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--accent)" }}
                >
                  Pilih Area Parkir
                </p>
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Tampilkan slot berdasarkan area yang dipilih
                </h3>
                <p
                  className="text-sm max-w-xl mx-auto"
                  style={{ color: "var(--text-dim)" }}
                >
                  Gunakan filter <strong>Area Parkir</strong> di atas agar petugas
                  fokus ke satu area saja. Ini membuat grid dan denah lebih rapi,
                  jelas, dan tidak menampilkan semua area sekaligus.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="space-y-5">
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-[24px] h-56 animate-pulse"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    />
                  ))
                ) : filteredSlots.length === 0 ? (
                  <div
                    className="rounded-[24px] p-8 text-center"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
                  >
                    Tidak ada slot yang sesuai filter saat ini.
                  </div>
                ) : (
                  groupedSlotsByLot.map((group) => (
                    <div
                      key={group.lotId || group.lotName}
                      className="space-y-3"
                      style={{
                        paddingTop: "0.25rem",
                      }}
                      >
                      {showInlineAreaHeader && (
                        <div
                          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-[22px] px-4 py-3"
                          style={{
                            background: "color-mix(in srgb, var(--surface) 88%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 14%, transparent)",
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                style={{
                                  color: "var(--accent)",
                                  background:
                                    "color-mix(in srgb, var(--accent) 12%, transparent)",
                                  border:
                                    "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                                }}
                              >
                                Area Parkir
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mt-2" style={{ color: "var(--text)" }}>
                              {group.lotName}
                            </h3>
                            {group.lotAddress && (
                              <p className="text-sm mt-1 truncate max-w-2xl" style={{ color: "var(--text-dim)" }}>
                                {group.lotAddress}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                              <span
                                className="rounded-full px-3 py-1"
                                style={{
                                  background: "var(--surface)",
                                  border: "1px solid var(--border)",
                                  color: "var(--text-dim)",
                                }}
                              >
                                Lantai: {group.floors.join(", ")}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                            {[
                              { label: "Total", value: group.slots.length, color: "var(--text)" },
                              { label: "Tersedia", value: group.available, color: "var(--accent)" },
                              { label: "Terisi", value: group.occupied, color: "var(--danger)" },
                              { label: "Perawatan", value: group.maintenance, color: "var(--warn)" },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="rounded-2xl px-3 py-2 min-w-[92px]"
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
                      )}

                      <div className="flex items-center gap-3 px-1">
                        <div
                          className="h-px flex-1"
                          style={{
                            background:
                              "linear-gradient(90deg, color-mix(in srgb, var(--accent) 42%, transparent), color-mix(in srgb, var(--border) 82%, transparent))",
                          }}
                        />
                        <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                          Grid Slot
                        </span>
                        <div
                          className="h-px flex-1"
                          style={{
                            background:
                              "linear-gradient(90deg, color-mix(in srgb, var(--border) 82%, transparent), color-mix(in srgb, var(--accent) 42%, transparent))",
                          }}
                        />
                      </div>

                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                        style={{
                          paddingTop: "0.25rem",
                        }}
                      >
                        {group.slots.map((slot) => (
                          <div key={slot.id} className="space-y-2">
                            <SlotCard
                              slot={slot}
                              onReserve={(target) => {
                                setSelectedSlot(target);
                                setReserveTarget(target);
                              }}
                              isOperator
                              onStatusChange={(id, status) => {
                                const target = filteredSlots.find((item) => item.id === id);
                                if (target) setSelectedSlot(target);
                                handleStatusChange(id, status);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <FloorMap
                slots={filteredSlots}
                selectedSlotId={selectedSlot?.id}
                onReserve={(slot) => {
                  setSelectedSlot(slot);
                  setReserveTarget(slot);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div>
            <SectionCard
              title={isAdmin ? "Daftar Slot" : "Daftar Slot Petugas"}
              subtitle={
                isAdmin
                  ? "Klik slot untuk melihat detail dan mengelola status"
                  : "Pilih slot untuk melihat detail dan perbarui status dengan cepat"
              }
            >
              {error ? (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background:
                      "color-mix(in srgb,var(--danger) 8%,transparent)",
                    border:
                      "1px solid color-mix(in srgb,var(--danger) 20%,transparent)",
                    color: "var(--danger)",
                  }}
                >
                  {error}
                </div>
              ) : (
                <div
                  className="rounded-[26px] overflow-hidden"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="grid grid-cols-12 px-4 py-3 text-xs font-medium uppercase tracking-wide"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-dim)",
                      background: "var(--surface)",
                    }}
                  >
                    <div className="col-span-2">Nomor</div>
                    <div className="col-span-2">Lantai</div>
                    <div className="col-span-2">Tipe</div>
                    <div className="col-span-3">Area</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">
                      {isAdmin ? "Aksi" : isOperatorOnly ? "Pilih" : "Lihat"}
                    </div>
                  </div>

                  {loading ? (
                    <div
                      className="p-4 text-sm"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Memuat data slot...
                    </div>
                  ) : filteredSlots.length === 0 ? (
                    <div
                      className="p-4 text-sm"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {slots.length === 0
                        ? "Belum ada slot terdaftar."
                        : "Tidak ada slot yang sesuai filter."}
                    </div>
                  ) : isOperatorOnly ? (
                    <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-auto">
                      {filteredSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className="w-full rounded-[26px] border border-slate-200/60 bg-slate-50/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                          style={{
                            borderColor:
                              selectedSlot?.id === slot.id
                                ? "var(--accent)"
                                : "rgba(148, 163, 184, 0.24)",
                            background:
                              selectedSlot?.id === slot.id
                                ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                                : "var(--bg)",
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}
                              >
                                {slot.number}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-dim)" }}
                              >
                                Lantai {slot.floor}
                              </p>
                            </div>
                            <div
                              className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold"
                              style={{
                                color: "var(--accent)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {slot.type === "standard"
                                ? "Standar"
                                : slot.type === "ev"
                                  ? "EV"
                                  : slot.type === "disabled"
                                    ? "Difabel"
                                    : slot.type}
                            </div>
                            <span className="text-xs text-slate-500">
                              {slot.lot?.name || "N/A"}
                            </span>
                            <span
                              className="ml-auto rounded-full px-3 py-1 text-[11px] font-semibold"
                              style={{
                                background:
                                  slot.status === "available"
                                    ? "color-mix(in srgb,var(--accent) 14%,transparent)"
                                    : slot.status === "occupied"
                                      ? "color-mix(in srgb,var(--danger) 14%,transparent)"
                                      : "color-mix(in srgb,var(--warn) 14%,transparent)",
                                color:
                                  slot.status === "available"
                                    ? "var(--accent)"
                                    : slot.status === "occupied"
                                      ? "var(--danger)"
                                      : "var(--warn)",
                              }}
                            >
                              {slot.status === "available"
                                ? "Tersedia"
                                : slot.status === "occupied"
                                  ? "Terisi"
                                  : slot.status === "maintenance"
                                    ? "Maintenance"
                                    : slot.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                              {slot.lot?.name || "N/A"}
                            </p>
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                              Pilih
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[calc(100vh-340px)] overflow-auto">
                      {filteredSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className="grid grid-cols-12 px-3 py-3 gap-2 items-center text-left w-full transition-colors"
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background:
                              selectedSlot?.id === slot.id
                                ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                                : "transparent",
                          }}
                        >
                          <div className="col-span-2">
                            <p
                              className="font-medium"
                              style={{ color: "var(--text)" }}
                            >
                              {slot.number}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p
                              className="text-sm"
                              style={{ color: "var(--text-dim)" }}
                            >
                              Lantai {slot.floor}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                background:
                                  "color-mix(in srgb,var(--accent) 10%,transparent)",
                                color: "var(--accent)",
                              }}
                            >
                              {slot.type === "standard"
                                ? "Standar"
                                : slot.type === "ev"
                                  ? "EV"
                                  : slot.type === "disabled"
                                    ? "Difabel"
                                    : slot.type}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <p
                              className="text-sm"
                              style={{ color: "var(--text-dim)" }}
                            >
                              {slot.lot?.name || "N/A"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                background:
                                  slot.status === "available"
                                    ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                                    : slot.status === "occupied"
                                      ? "color-mix(in srgb,var(--danger) 10%,transparent)"
                                      : "color-mix(in srgb,var(--warn) 10%,transparent)",
                                color:
                                  slot.status === "available"
                                    ? "var(--accent)"
                                    : slot.status === "occupied"
                                      ? "var(--danger)"
                                      : "var(--warn)",
                              }}
                            >
                              {slot.status === "available"
                                ? "Tersedia"
                                : slot.status === "occupied"
                                  ? "Terisi"
                                  : slot.status === "maintenance"
                                    ? "Maintenance"
                                    : slot.status}
                            </span>
                          </div>
                          <div className="col-span-1 text-right">
                            {isAdmin ? (
                              <div className="flex gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditForm(slot);
                                  }}
                                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                                  style={{ color: "var(--accent)" }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(slot);
                                  }}
                                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                                  style={{ color: "var(--danger)" }}
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : isOperatorOnly ? (
                              <span className="text-xs text-slate-500">
                                Pilih
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Lihat
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <div>
            <SectionCard
              title="Detail Slot"
              subtitle={
                isAdmin
                  ? "Klik baris slot untuk melihat informasi detail."
                  : "Pilih slot untuk melihat detail dan mengubah status."
              }
            >
              <div className="p-5">
                {selectedSlot ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Nomor Slot
                      </label>
                      <p
                        className="text-sm font-medium mt-1"
                        style={{ color: "var(--text)" }}
                      >
                        {selectedSlot.number}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Lantai
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        Lantai {selectedSlot.floor}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Tipe Slot
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {selectedSlot.type === "standard"
                          ? "Standar"
                          : selectedSlot.type === "ev"
                            ? "EV"
                            : selectedSlot.type === "disabled"
                              ? "Difabel"
                              : selectedSlot.type}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Area Parkir
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {selectedSlot.lot?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Harga/Jam
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        Rp {selectedSlot.pricePerHour?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Status
                      </label>
                      <p className="text-sm mt-1">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background:
                              selectedSlot.status === "available"
                                ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                                : selectedSlot.status === "occupied"
                                  ? "color-mix(in srgb,var(--danger) 10%,transparent)"
                                  : "color-mix(in srgb,var(--warn) 10%,transparent)",
                            color:
                              selectedSlot.status === "available"
                                ? "var(--accent)"
                                : selectedSlot.status === "occupied"
                                  ? "var(--danger)"
                                  : "var(--warn)",
                          }}
                        >
                          {selectedSlot.status === "available"
                            ? "Tersedia"
                            : selectedSlot.status === "occupied"
                              ? "Terisi"
                              : selectedSlot.status === "maintenance"
                                ? "Maintenance"
                                : selectedSlot.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Aktif
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {selectedSlot.isActive ? "Ya" : "Tidak"}
                      </p>
                    </div>
                    {selectedSlot.currentReservation && (
                      <div>
                        <label className="text-xs font-medium text-slate-500">
                          Reservasi Aktif
                        </label>
                        <p
                          className="text-sm mt-1"
                          style={{ color: "var(--text-dim)" }}
                        >
                          {selectedSlot.currentReservation.vehicle
                            ?.licensePlate || "N/A"}
                        </p>
                      </div>
                    )}

                    {isOperatorOnly && (
                      <div className="space-y-3">
                        <div>
                          <label className="label">Ubah Status</label>
                          <select
                            className="input w-full"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                          >
                            <option value="available">Tersedia</option>
                            <option value="occupied">Terisi</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          className="btn-primary w-full py-3"
                          disabled={
                            statusSaving ||
                            selectedStatus === selectedSlot.status
                          }
                          onClick={() =>
                            handleStatusChange(selectedSlot.id, selectedStatus)
                          }
                        >
                          {statusSaving ? "Menyimpan..." : "Simpan Status"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    Pilih slot dari daftar untuk melihat detail.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {showSlotForm && (
        <SlotFormModal
          slot={editingSlot}
          lots={lots}
          onClose={() => {
            setShowSlotForm(false);
            setEditingSlot(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {reserveTarget && (
        <ReserveModal
          slot={reserveTarget}
          onClose={() => setReserveTarget(null)}
          onSuccess={handleReserveSuccess}
        />
      )}

      {showTicketModal && ticketTarget && (
        <QRTicketModal
          reservation={ticketTarget}
          onClose={() => setShowTicketModal(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={`Hapus slot ${confirmDelete?.number}?`}
        description="Pastikan slot tidak memiliki reservasi aktif sebelum menghapus. Aksi ini tidak bisa dibatalkan."
        tone="danger"
        loading={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteSlot}
      />
    </div>
  );
}


