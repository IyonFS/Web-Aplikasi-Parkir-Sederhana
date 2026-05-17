import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auditService } from "../services/audit.service";
import { PageHeader, SectionCard, Toast, RoleBadge } from "../components/ui";
import { formatDateShort } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const ENTITY_OPTIONS = ["", "parking_lot", "user", "reservation", "payment"];
const ACTION_OPTIONS = ["", "create", "update", "archive", "delete"];

export default function ActivityLogsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [toast, setToast] = useState(null);

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
      const data = await auditService.list({ page, limit: 15, entity, action });
      setLogs(data.logs || []);
      setMeta({ total: data.total || 0, totalPages: data.totalPages || 1 });
    } catch (error) {
      setToast({
        msg: error.response?.data?.error || "Gagal memuat log aktivitas",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, entity, action]);

  useEffect(() => {
    load();
  }, [load]);

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
        title="Log Aktivitas"
        subtitle="Modul admin untuk memantau perubahan data dan aktivitas penting dalam sistem."
        badge="Admin"
      />

      <SectionCard
        title="Filter Log"
        subtitle="Gunakan filter sederhana agar penguji mudah melihat bukti aktivitas sistem."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Entity</label>
            <select
              className="input"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
            >
              {ENTITY_OPTIONS.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "Semua entity"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Action</label>
            <select
              className="input"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              {ACTION_OPTIONS.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "Semua aksi"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => {
                setEntity("");
                setAction("");
                setPage(1);
              }}
            >
              Reset Filter
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Daftar Aktivitas"
        subtitle={`${meta.total} log tercatat di sistem.`}
      >
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-auto pr-2">
          {loading ? (
            [0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl animate-pulse"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              />
            ))
          ) : logs.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-sm"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-dim)",
              }}
            >
              Belum ada log untuk filter yang dipilih.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-[24px] p-4"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
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
                        {log.entity}
                      </span>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          color: "var(--accent)",
                          background:
                            "color-mix(in srgb, var(--accent) 10%, transparent)",
                          border:
                            "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                        }}
                      >
                        {log.action}
                      </span>
                      {log.user?.role && <RoleBadge role={log.user.role} />}
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {log.user?.name || "Sistem"}
                      {log.user?.email ? ` • ${log.user.email}` : ""}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {formatDateShort(log.createdAt)}
                      {log.ipAddress ? ` • IP ${log.ipAddress}` : ""}
                    </p>
                    {log.metadata && (
                      <pre
                        className="mt-3 text-xs whitespace-pre-wrap break-words rounded-2xl p-3 overflow-auto"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--text-dim)",
                        }}
                      >
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div
                    className="text-right text-xs"
                    style={{ color: "var(--text-dim)" }}
                  >
                    <p>ID Entity</p>
                    <p
                      className="font-mono mt-1"
                      style={{ color: "var(--text)" }}
                    >
                      {log.entityId || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Halaman {page} dari {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost px-3 py-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-ghost px-3 py-2 text-xs"
                disabled={page === meta.totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(meta.totalPages, prev + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

