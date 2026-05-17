import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tariffsService } from "../services/tariffs.service";
import { PageHeader, SectionCard, Toast } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatIDR } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const VEHICLE_TYPES = ["motorcycle", "car", "van", "bus", "other"];
const EMPTY_FORM = {
  name: "",
  vehicleType: "car",
  pricePerHour: 5000,
  description: "",
  isActive: true,
};

function labelVehicleType(value) {
  return (
    {
      motorcycle: "Motor",
      car: "Mobil",
      van: "Van",
      bus: "Bus",
      other: "Lainnya",
    }[value] || value
  );
}

export default function ParkingTariffsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/app/dashboard");
      return;
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tariffsService.list();
      setTariffs(data.tariffs || []);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal memuat tarif parkir",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: tariffs.length,
      aktif: tariffs.filter((item) => item.isActive).length,
      rataRata: tariffs.length
        ? Math.round(
            tariffs.reduce((sum, item) => sum + item.pricePerHour, 0) /
              tariffs.length,
          )
        : 0,
    }),
    [tariffs],
  );

  const startCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (tariff) => {
    setSelected(tariff);
    setForm({
      name: tariff.name || "",
      vehicleType: tariff.vehicleType || "car",
      pricePerHour: tariff.pricePerHour || 0,
      description: tariff.description || "",
      isActive: tariff.isActive,
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (selected?.id) {
        await tariffsService.update(selected.id, form);
        showToast("Tarif parkir berhasil diperbarui");
      } else {
        await tariffsService.create(form);
        showToast("Tarif parkir berhasil ditambahkan");
      }
      startCreate();
      load();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal menyimpan tarif parkir",
        "error",
      );
    } finally {
      setSaving(false);
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
        title="Tarif Parkir"
        subtitle="Modul admin untuk mengelola tarif parkir berdasarkan jenis kendaraan."
        badge="Admin"
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={startCreate}
          >
            Tambah Tarif
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Tarif", value: stats.total, color: "var(--accent)" },
          { label: "Tarif Aktif", value: stats.aktif, color: "#60a5fa" },
          {
            label: "Rata-rata per Jam",
            value: formatIDR(stats.rataRata),
            color: "#f59e0b",
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_360px] gap-4 items-start">
        <SectionCard
          title="Daftar Tarif"
          subtitle="Tarif dipisah sebagai modul khusus agar mudah dijelaskan saat ujian."
        >
          <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-auto pr-2">
            {loading ? (
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 rounded-2xl animate-pulse"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))
            ) : tariffs.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                Belum ada tarif parkir. Tambahkan tarif pertama untuk melengkapi
                modul admin.
              </div>
            ) : (
              tariffs.map((tariff) => (
                <div
                  key={tariff.id}
                  className="rounded-[24px] p-4"
                  style={{
                    background:
                      selected?.id === tariff.id
                        ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                        : "var(--surface)",
                    border: `1px solid ${selected?.id === tariff.id ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            color: tariff.isActive
                              ? "var(--accent)"
                              : "var(--warn)",
                            background: tariff.isActive
                              ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                              : "color-mix(in srgb, var(--warn) 10%, transparent)",
                            border: `1px solid ${tariff.isActive ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "color-mix(in srgb, var(--warn) 20%, transparent)"}`,
                          }}
                        >
                          {tariff.isActive ? "Aktif" : "Nonaktif"}
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
                          {labelVehicleType(tariff.vehicleType)}
                        </span>
                      </div>
                      <h3
                        className="text-base font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {tariff.name}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: "#f59e0b" }}>
                        {formatIDR(tariff.pricePerHour)} / jam
                      </p>
                      {tariff.description && (
                        <p
                          className="text-xs mt-2"
                          style={{ color: "var(--text-dim)" }}
                        >
                          {tariff.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                        onClick={() => startEdit(tariff)}
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
                        onClick={() => setConfirmDelete(tariff)}
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={selected ? "Edit Tarif" : "Form Tarif Baru"}
          subtitle="Form dibuat sederhana agar alurnya mudah dipahami penguji."
        >
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="label">Nama Tarif</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Contoh: Tarif Mobil Reguler"
              />
            </div>
            <div>
              <label className="label">Jenis Kendaraan</label>
              <select
                className="input"
                value={form.vehicleType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, vehicleType: e.target.value }))
                }
              >
                {VEHICLE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {labelVehicleType(item)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tarif per Jam</label>
              <input
                type="number"
                min="1000"
                className="input"
                value={form.pricePerHour}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pricePerHour: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Deskripsi</label>
              <textarea
                className="input min-h-[96px]"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Catatan singkat tarif"
              />
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
              Tarif aktif
            </label>
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
                    : "Tambah Tarif"}
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
          title={`Nonaktifkan tarif ${confirmDelete.name}?`}
          description="Tarif tidak dihapus permanen agar data tetap aman untuk audit dan presentasi."
          confirmLabel="Ya, nonaktifkan"
          cancelLabel="Batal"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const target = confirmDelete;
            setConfirmDelete(null);
            try {
              await tariffsService.remove(target.id);
              showToast("Tarif parkir dinonaktifkan");
              if (selected?.id === target.id) startCreate();
              load();
            } catch (error) {
              showToast(
                error.response?.data?.error ||
                  "Gagal menonaktifkan tarif parkir",
                "error",
              );
            }
          }}
        />
      )}
    </div>
  );
}

