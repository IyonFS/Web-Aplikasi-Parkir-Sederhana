import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersService } from "../services/users.service";
import { PageHeader, Toast } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const NEW_USER = {
  name: "",
  email: "",
  password: "password123",
  role: "user",
  isActive: true,
};

export default function UserManagementPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(NEW_USER);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/app/dashboard");
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(
    async (options = {}) => {
      setLoading(true);
      setError("");

      try {
        const currentSearch = options.search ?? search;
        const currentRole = options.role ?? roleFilter;
        const params = {
          limit: 50,
          ...(currentSearch ? { search: currentSearch } : {}),
          ...(currentRole !== "all" ? { role: currentRole } : {}),
        };
        const data = await usersService.list(params);
        setUsers(data.users || []);
      } catch (err) {
        setError(err.response?.data?.error || "Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter],
  );

  const loadUserDetail = async (id) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const data = await usersService.getUser(id);
      setSelectedUser(data);
    } catch (err) {
      showToast(
        err.response?.data?.error || "Gagal memuat detail user",
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectedUserChange = (field, value) => {
    setSelectedUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeletingUser(true);
    try {
      await usersService.deleteUser(confirmDelete.id);
      showToast("User berhasil dihapus");
      setSelectedUser(null);
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal menghapus user", "error");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSaveSelectedUser = async () => {
    if (!selectedUser) return;
    setSavingDetail(true);
    try {
      await usersService.update(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
      });
      showToast("Detail user berhasil disimpan");
      loadUsers();
      loadUserDetail(selectedUser.id);
    } catch (err) {
      showToast(
        err.response?.data?.error || "Gagal menyimpan detail user",
        "error",
      );
    } finally {
      setSavingDetail(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await usersService.create(form);
      showToast("User berhasil dibuat");
      setForm(NEW_USER);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal membuat user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-7 w-full max-w-none">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Kelola Pengguna"
        subtitle="Daftar user di sistem Hygiopark"
        badge="Admin"
        action={
          <button
            type="button"
            className="btn-primary text-xs py-2 px-3"
            onClick={() => setShowForm(true)}
          >
            Tambah User
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <input
            type="search"
            className="input w-full"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              loadUsers({ search: value });
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-xs font-medium text-slate-500">
            Filter role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => {
              const value = e.target.value;
              setRoleFilter(value);
              setSelectedUser(null);
              loadUsers({ role: value });
            }}
            className="input w-full mt-1"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          {error ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "color-mix(in srgb,var(--danger) 8%,transparent)",
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
                <div className="col-span-4">Nama</div>
                <div className="col-span-4 hidden md:block">Email</div>
                <div className="col-span-2 hidden lg:block">Role</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              <div className="max-h-[calc(100vh-340px)] overflow-auto">
                {loading ? (
                  <div
                    className="p-4 text-sm"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Memuat data user...
                  </div>
                ) : users.length === 0 ? (
                  <div
                    className="p-4 text-sm"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Belum ada user terdaftar.
                  </div>
                ) : (
                  users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => loadUserDetail(user.id)}
                      className="grid grid-cols-12 px-4 py-4 gap-2 items-center text-left w-full transition-colors"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background:
                          selectedUser?.id === user.id
                            ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                            : "transparent",
                      }}
                    >
                      <div className="col-span-4">
                        <p
                          className="font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {user.name}
                        </p>
                      </div>
                      <div className="col-span-4 hidden md:block">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-dim)" }}
                        >
                          {user.email}
                        </p>
                      </div>
                      <div className="col-span-2 hidden lg:block">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background:
                              "color-mix(in srgb,var(--accent) 10%,transparent)",
                            color: "var(--accent)",
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: user.isActive
                              ? "color-mix(in srgb,var(--accent) 10%,transparent)"
                              : "color-mix(in srgb,var(--danger) 10%,transparent)",
                            color: user.isActive
                              ? "var(--accent)"
                              : "var(--danger)",
                          }}
                        >
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <div
            className="rounded-[26px] overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="p-5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                Detail User
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                Klik baris user untuk melihat data detail dan status akun.
              </p>
            </div>

            <div className="p-5">
              {detailLoading ? (
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                  Memuat detail...
                </p>
              ) : selectedUser ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-xs uppercase tracking-[0.18em] mb-1 block"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={selectedUser.name}
                      onChange={(e) =>
                        handleSelectedUserChange("name", e.target.value)
                      }
                      className="w-full input"
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs uppercase tracking-[0.18em] mb-1 block"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) =>
                        handleSelectedUserChange("email", e.target.value)
                      }
                      className="w-full input"
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs uppercase tracking-[0.18em] mb-1 block"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Role
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) =>
                        handleSelectedUserChange("role", e.target.value)
                      }
                      className="w-full input"
                    >
                      <option value="user">User</option>
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label
                        className="text-xs uppercase tracking-[0.18em] mb-1 block"
                        style={{ color: "var(--text-dim)" }}
                      >
                        Status
                      </label>
                      <p className="text-sm" style={{ color: "var(--text)" }}>
                        {selectedUser.isActive ? "Aktif" : "Nonaktif"}
                      </p>
                    </div>
                    <label
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUser.isActive}
                        onChange={(e) =>
                          handleSelectedUserChange("isActive", e.target.checked)
                        }
                      />
                      Aktif
                    </label>
                  </div>
                  <div>
                    <p
                      className="text-xs uppercase tracking-[0.18em] mb-1"
                      style={{ color: "var(--text-dim)" }}
                    >
                      Terdaftar
                    </p>
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={handleSaveSelectedUser}
                      disabled={savingDetail}
                      className="flex-1 py-2 rounded-lg text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {savingDetail ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(selectedUser)}
                      className="flex-1 py-2 rounded-lg border"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--danger)",
                      }}
                    >
                      Hapus User
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                  Pilih user untuk melihat detail.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text)" }}
              >
                Buat User Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xl"
                style={{ color: "var(--muted)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Nama
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full input"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full input"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full input"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full input"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <label
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text)" }}
                >
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
                  Aktif
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={`Hapus user ${confirmDelete?.name}?`}
        description="Aksi ini akan menghapus pengguna secara permanen dari sistem. Pastikan pilihan sudah benar sebelum melanjutkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        loading={deletingUser}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}


