import { useState, useEffect } from "react";
import { slotsService } from "../services/slots.service";
import { formatIDR } from "../lib/format";

export default function SlotFormModal({
  slot,
  lots,
  onClose,
  onSuccess,
  loading: externalLoading,
}) {
  const [form, setForm] = useState({
    number: "",
    floor: "",
    type: "standard",
    pricePerHour: 5000,
    lotId: "",
    status: "available",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(externalLoading);

  const isEdit = Boolean(slot?.id);

  useEffect(() => {
    if (slot) {
      setForm({
        number: slot.number,
        floor: slot.floor,
        type: slot.type,
        pricePerHour: slot.pricePerHour,
        lotId: slot.lotId,
        status: slot.status,
        isActive: slot.isActive,
      });
    }
  }, [slot]);

  const formatPriceValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    return new Intl.NumberFormat("id-ID").format(Number(value));
  };

  const handlePriceChange = (value) => {
    const digits = value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      pricePerHour: digits === "" ? "" : Number(digits),
    }));
    setErrors((prev) => ({ ...prev, pricePerHour: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.number || form.number.toString().trim() === "")
      nextErrors.number = "Nomor slot wajib diisi";
    if (!form.floor || form.floor.toString().trim() === "")
      nextErrors.floor = "Lantai wajib diisi";
    if (!form.lotId) nextErrors.lotId = "Area parkir wajib dipilih";
    if (
      form.pricePerHour === "" ||
      form.pricePerHour === null ||
      Number.isNaN(form.pricePerHour)
    ) {
      nextErrors.pricePerHour = "Harga per jam wajib diisi";
    } else if (form.pricePerHour < 0) {
      nextErrors.pricePerHour = "Harga tidak boleh negatif";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await slotsService.update(slot.id, {
          number: form.number,
          floor: form.floor,
          type: form.type,
          pricePerHour: form.pricePerHour,
          status: form.status,
          isActive: form.isActive,
          lotId: form.lotId,
        });
      } else {
        await slotsService.create({
          number: form.number,
          floor: form.floor,
          type: form.type,
          pricePerHour: form.pricePerHour,
          lotId: form.lotId,
          status: form.status,
          isActive: form.isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({
        submit: err.response?.data?.error || "Gagal menyimpan slot",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl p-6 w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto animate-fadeUp"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(15, 23, 42, 0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--text)" }}
          >
            {isEdit ? "Edit Slot" : "Buat Slot Baru"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl"
            style={{ color: "var(--muted)" }}
          >
            ×
          </button>
        </div>

        {errors.submit && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm"
            style={{
              background: "color-mix(in srgb,var(--danger) 10%,transparent)",
              border:
                "1px solid color-mix(in srgb,var(--danger) 20%,transparent)",
              color: "var(--danger)",
            }}
          >
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nomor Slot</label>
              <input
                type="text"
                className="input"
                value={form.number}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, number: e.target.value }));
                  setErrors((prev) => ({ ...prev, number: "" }));
                }}
                placeholder="A1, B5, dll"
                style={errors.number ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.number && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {errors.number}
                </p>
              )}
            </div>
            <div>
              <label className="label">Lantai</label>
              <input
                type="text"
                className="input"
                value={form.floor}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, floor: e.target.value }));
                  setErrors((prev) => ({ ...prev, floor: "" }));
                }}
                placeholder="1, 2, 3..."
                style={errors.floor ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.floor && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {errors.floor}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipe Slot</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="standard">Standar</option>
                <option value="ev">EV Charging</option>
                <option value="disabled">Difabel</option>
              </select>
            </div>
            <div>
              <label className="label">Harga/Jam</label>
              <input
                type="text"
                className="input font-mono"
                value={formatPriceValue(form.pricePerHour)}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="5.000"
                inputMode="numeric"
                pattern="[0-9]*"
                style={
                  errors.pricePerHour ? { borderColor: "var(--danger)" } : {}
                }
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                {form.pricePerHour !== "" && formatIDR(form.pricePerHour)} / jam
              </p>
              {errors.pricePerHour && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {errors.pricePerHour}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="label">Area Parkir</label>
            <select
              className="input"
              value={form.lotId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, lotId: e.target.value }));
                setErrors((prev) => ({ ...prev, lotId: "" }));
              }}
              style={errors.lotId ? { borderColor: "var(--danger)" } : {}}
            >
              <option value="">Pilih area</option>
              {lots?.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
            {errors.lotId && (
              <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                {errors.lotId}
              </p>
            )}
          </div>

          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="available">Tersedia</option>
                  <option value="occupied">Terisi</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Aktif
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-dim)",
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-white"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Menyimpan..." : isEdit ? "Perbarui" : "Buat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

