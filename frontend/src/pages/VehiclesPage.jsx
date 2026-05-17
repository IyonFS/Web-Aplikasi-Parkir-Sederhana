import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vehiclesService } from "../services/vehicles.service";
import { usersService } from "../services/users.service";
import { PageHeader, SectionCard, Toast, RoleBadge } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const VEHICLE_TYPES = ["motorcycle", "car", "van", "bus", "other"];
const EMPTY_FORM = {
  ownerId: "",
  plateNumber: "",
  vehicleType: "car",
  brand: "",
  color: "",
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

export default function VehiclesPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [owners, setOwners] = useState([]);
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
      const [vehiclesData, ownersData] = await Promise.all([
        vehiclesService.list(),
        usersService.list({ role: "user", limit: 100 }),
      ]);
      setVehicles(vehiclesData.vehicles || []);
      setOwners(ownersData.users || []);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal memuat data kendaraan",
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
      total: vehicles.length,
      aktif: vehicles.filter((item) => item.isActive).length,
      terhubungOwner: vehicles.filter((item) => item.owner).length,
    }),
    [vehicles],
  );

  const startCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (vehicle) => {
    setSelected(vehicle);
    setForm({
      ownerId: vehicle.ownerId || "",
      plateNumber: vehicle.plateNumber || "",
      vehicleType: vehicle.vehicleType || "car",
      brand: vehicle.brand || "",
      color: vehicle.color || "",
      isActive: vehicle.isActive,
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (selected?.id) {
        await vehiclesService.update(selected.id, form);
        showToast("Data kendaraan berhasil diperbarui");
      } else {
        await vehiclesService.create(form);
        showToast("Data kendaraan berhasil ditambahkan");
      }
      startCreate();
      load();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Gagal menyimpan data kendaraan",
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
        title="Kendaraan"
        subtitle="Modul admin untuk mendata kendaraan dan pemiliknya."
        badge="Admin"
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={startCreate}
          >
            Tambah Kendaraan
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total Kendaraan",
            value: stats.total,
            color: "var(--accent)",
          },
          { label: "Kendaraan Aktif", value: stats.aktif, color: "#60a5fa" },
          {
            label: "Terhubung ke Owner",
            value: stats.terhubungOwner,
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
          title="Daftar Kendaraan"
          subtitle="Nomor plat dibuat unik supaya data kendaraan mudah divalidasi saat demo."
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
            ) : vehicles.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                Belum ada kendaraan terdaftar.
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="rounded-[24px] p-4"
                  style={{
                    background:
                      selected?.id === vehicle.id
                        ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                        : "var(--surface)",
                    border: `1px solid ${selected?.id === vehicle.id ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-mono"
                          style={{
                            color: "var(--text)",
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {vehicle.plateNumber}
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
                          {labelVehicleType(vehicle.vehicleType)}
                        </span>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            color: vehicle.isActive
                              ? "var(--accent)"
                              : "var(--warn)",
                            background: vehicle.isActive
                              ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                              : "color-mix(in srgb, var(--warn) 10%, transparent)",
                            border: `1px solid ${vehicle.isActive ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "color-mix(in srgb, var(--warn) 20%, transparent)"}`,
                          }}
                        >
                          {vehicle.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                        {vehicle.owner?.role && (
                          <RoleBadge role={vehicle.owner.role} />
                        )}
                      </div>
                      <h3
                        className="text-base font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {vehicle.brand || "Tanpa merek"}
                        {vehicle.color ? ` • ${vehicle.color}` : ""}
                      </h3>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {vehicle.owner?.name || "Belum terhubung ke owner"}
                      </p>
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
                        onClick={() => startEdit(vehicle)}
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
                        onClick={() => setConfirmDelete(vehicle)}
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
          title={selected ? "Edit Kendaraan" : "Form Kendaraan Baru"}
          subtitle="Struktur sederhana: owner, plat nomor, jenis, merek, dan warna."
        >
          <form className="space-y-3" onSubmit={submit}>
            <div>
              <label className="label">Owner</label>
              <select
                className="input"
                value={form.ownerId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ownerId: e.target.value }))
                }
              >
                <option value="">Belum ditetapkan</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nomor Plat</label>
              <input
                className="input uppercase"
                value={form.plateNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    plateNumber: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="B 1234 XYZ"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Merek</label>
                <input
                  className="input"
                  value={form.brand}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  placeholder="Toyota / Honda"
                />
              </div>
              <div>
                <label className="label">Warna</label>
                <input
                  className="input"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="Hitam / Putih"
                />
              </div>
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
              Kendaraan aktif
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
                    : "Tambah Kendaraan"}
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
          title={`Nonaktifkan kendaraan ${confirmDelete.plateNumber}?`}
          description="Data kendaraan tidak dihapus permanen agar tetap aman untuk audit dan presentasi."
          confirmLabel="Ya, nonaktifkan"
          cancelLabel="Batal"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const target = confirmDelete;
            setConfirmDelete(null);
            try {
              await vehiclesService.remove(target.id);
              showToast("Kendaraan dinonaktifkan");
              if (selected?.id === target.id) startCreate();
              load();
            } catch (error) {
              showToast(
                error.response?.data?.error || "Gagal menonaktifkan kendaraan",
                "error",
              );
            }
          }}
        />
      )}
    </div>
  );
}

