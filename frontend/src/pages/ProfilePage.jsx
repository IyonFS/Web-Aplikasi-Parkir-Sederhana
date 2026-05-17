import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { PageHeader, RoleBadge, SectionCard, Toast } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { formatDate, validateEmail } from "../lib/format";
import { usersService } from "../services/users.service";

const PHONE_REGEX = /^(\+62|62|08)[0-9]{8,13}$/;

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="m4 4 16 16" />}
    </svg>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Lemah", "Cukup", "Sedang", "Kuat", "Sangat kuat"];
  const colors = ["", "var(--danger)", "var(--warn)", "var(--warn)", "var(--accent)", "var(--accent)"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-1 flex-1 rounded-full"
            style={{ background: item <= score ? colors[score] : "var(--border)" }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] }}>
        Kekuatan password: {labels[score]}
      </p>
    </div>
  );
}

function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("08")) return `+62${cleaned.slice(1)}`;
  return cleaned;
}

function PasswordField({ label, value, error, visible, autoComplete, onChange, onToggle }) {
  const [isArmed, setIsArmed] = useState(false);

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-12"
          type={visible ? "text" : "password"}
          name={`profile-${label.toLowerCase().replace(/\s+/g, "-")}`}
          value={value}
          autoComplete={isArmed ? autoComplete : "off"}
          readOnly={!isArmed}
          onChange={onChange}
          onFocus={() => setIsArmed(true)}
          onBlur={() => {
            if (!value) setIsArmed(false);
          }}
          style={error ? { borderColor: "var(--danger)" } : {}}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-3 my-auto h-8 px-2 rounded-lg inline-flex items-center justify-center"
          style={{ color: "var(--text-dim)" }}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          title={visible ? "Sembunyikan password" : "Tampilkan password"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser, syncUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirm: false,
  });
  const [confirmPasswordChange, setConfirmPasswordChange] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });
  const [initialProfileForm, setInitialProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
  };

  useEffect(() => {
    usersService
      .getProfile()
      .then((data) => {
        const nextProfile = {
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          avatarUrl: data.user?.avatarUrl || "",
        };

        setProfile(data);
        setProfileForm(nextProfile);
        setInitialProfileForm(nextProfile);
      })
      .catch(() => showToast("Gagal memuat profil", "error"))
      .finally(() => setLoading(false));
  }, []);

  const currentUser = profile?.user || authUser;
  const profileDirty = useMemo(
    () =>
      ["name", "email", "phone", "avatarUrl"].some(
        (key) => (profileForm[key] || "") !== (initialProfileForm[key] || ""),
      ),
    [profileForm, initialProfileForm],
  );
  const passwordDirty = useMemo(
    () => Object.values(passwordForm).some(Boolean),
    [passwordForm],
  );

  const securityItems = useMemo(
    () => [
      {
        label: "Login terakhir",
        value: profile?.security?.lastLoginAt
          ? formatDate(profile.security.lastLoginAt)
          : "Belum tercatat",
      },
      {
        label: "Perangkat terakhir",
        value: profile?.security?.lastLoginDevice || "Belum tercatat",
      },
    ],
    [profile],
  );

  const validateProfileForm = () => {
    const nextErrors = {};
    const normalizedPhone = normalizePhone(profileForm.phone);

    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      nextErrors.name = "Nama minimal 2 karakter";
    }
    const emailError = validateEmail(profileForm.email.trim());
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      nextErrors.phone = "Nomor HP tidak valid";
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const nextErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = "Password lama wajib diisi";
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      nextErrors.newPassword = "Password baru minimal 6 karakter";
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      nextErrors.newPassword = "Password baru harus berbeda dari password lama";
    }
    if (passwordForm.confirm !== passwordForm.newPassword) {
      nextErrors.confirm = "Konfirmasi password tidak cocok";
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const applyProfile = (data, successMessage) => {
    const nextUser = data.user;
    const nextProfileData = {
      ...(profile || {}),
      user: nextUser,
      security: {
        lastLoginAt: nextUser.lastLoginAt || profile?.security?.lastLoginAt || null,
        lastLoginDevice: nextUser.lastLoginDevice || profile?.security?.lastLoginDevice || null,
      },
    };
    const nextForm = {
      name: nextUser.name || "",
      email: nextUser.email || "",
      phone: nextUser.phone || "",
      avatarUrl: nextUser.avatarUrl || "",
    };

    setProfile(nextProfileData);
    setProfileForm(nextForm);
    setInitialProfileForm(nextForm);
    syncUser({ ...authUser, ...nextUser });
    showToast(successMessage);
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!validateProfileForm() || !profileDirty) return;

    setProfileSaving(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: normalizePhone(profileForm.phone),
        avatarUrl: profileForm.avatarUrl || null,
      };
      const data = await usersService.updateProfile(payload);
      applyProfile(data, "Perubahan berhasil disimpan");
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal menyimpan profil", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar", "error");
      return;
    }
    if (file.size > 1_000_000) {
      showToast("Ukuran foto maksimal 1 MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleProfileChange("avatarUrl", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const requestPasswordChange = (event) => {
    event.preventDefault();
    if (!validatePasswordForm()) return;
    setConfirmPasswordChange(true);
  };

  const submitPasswordChange = async () => {
    setPasswordSaving(true);
    try {
      await usersService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPasswordErrors({});
      setConfirmPasswordChange(false);
      showToast("Password berhasil diubah");
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal mengubah password", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div
          className="w-7 h-7 rounded-full animate-spin"
          style={{ border: "2px solid var(--border)", borderTopColor: "var(--accent)" }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 xl:p-7 w-full max-w-none space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmPasswordChange}
        title="Ganti password akun?"
        description="Apakah kamu yakin ingin mengganti password? Pastikan password baru mudah diingat oleh kamu dan tidak dibagikan ke orang lain."
        confirmLabel="Ya, ganti password"
        cancelLabel="Batal"
        tone="warn"
        loading={passwordSaving}
        onConfirm={submitPasswordChange}
        onClose={() => !passwordSaving && setConfirmPasswordChange(false)}
      />

      <PageHeader
        title="Profil Saya"
        subtitle="Kelola identitas akun, kontak, foto profil, dan keamanan dengan tampilan yang lebih sederhana."
        badge="Profil"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
        <div className="space-y-5 xl:sticky xl:top-6">
          <SectionCard title="Foto Profil" subtitle="Avatar akun untuk tampil lebih personal di seluruh aplikasi." icon="F">
            <div
              className="rounded-[28px] p-5"
              style={{
                background:
                  "linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, #60a5fa 8%, transparent), var(--surface) 72%)",
                border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-28 h-28 rounded-[28px] overflow-hidden flex items-center justify-center text-4xl font-bold"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--accent)",
                  }}
                >
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.[0]?.toUpperCase() || "U"
                  )}
                </div>

                <h2 className="mt-4 font-display text-2xl" style={{ color: "var(--text)" }}>
                  {profileForm.name || currentUser?.name}
                </h2>
                <div className="mt-2">
                  <RoleBadge role={currentUser?.role} />
                </div>
                <p className="mt-3 text-sm" style={{ color: "var(--text-dim)" }}>
                  {profileForm.email || currentUser?.email}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full mt-5">
                  <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                    Upload Foto
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleProfileChange("avatarUrl", "")}
                    disabled={!profileForm.avatarUrl}
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setProfileForm(initialProfileForm);
                      setProfileErrors({});
                    }}
                    disabled={!profileDirty}
                  >
                    Atur Ulang
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Keamanan Singkat" subtitle="Informasi aktivitas akun yang paling sering dibutuhkan." icon="S">
            <div className="space-y-3">
              {securityItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl p-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-dim)" }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold mt-2" style={{ color: "var(--text)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
              <div
                className="rounded-2xl p-4 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
                  color: "var(--text-dim)",
                }}
              >
                Akun dibuat pada {formatDate(currentUser?.createdAt)} dan tetap bisa kamu kelola dari halaman ini.
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            title="Informasi Akun"
            subtitle="Bagian inti yang paling umum dipakai pengguna untuk memperbarui data profil."
            icon="P"
            action={
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  color: profileDirty ? "var(--warn)" : "var(--text-dim)",
                  background: profileDirty
                    ? "color-mix(in srgb, var(--warn) 10%, transparent)"
                    : "var(--surface)",
                  border: `1px solid ${profileDirty ? "color-mix(in srgb, var(--warn) 20%, transparent)" : "var(--border)"}`,
                }}
              >
                {profileDirty ? "Perubahan belum disimpan" : "Tidak ada perubahan"}
              </span>
            }
          >
            <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nama Lengkap</label>
                <input
                  className="input"
                  value={profileForm.name}
                  autoComplete="name"
                  onChange={(event) => handleProfileChange("name", event.target.value)}
                  style={profileErrors.name ? { borderColor: "var(--danger)" } : {}}
                />
                {profileErrors.name && (
                  <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                    {profileErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  value={profileForm.email}
                  autoComplete="email"
                  onChange={(event) => handleProfileChange("email", event.target.value)}
                  style={profileErrors.email ? { borderColor: "var(--danger)" } : {}}
                />
                {profileErrors.email && (
                  <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                    {profileErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Nomor HP</label>
                <input
                  className="input"
                  placeholder="08xxxxxxxxxx"
                  value={profileForm.phone}
                  autoComplete="tel"
                  onChange={(event) => handleProfileChange("phone", event.target.value)}
                  style={profileErrors.phone ? { borderColor: "var(--danger)" } : {}}
                />
                {profileErrors.phone && (
                  <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                    {profileErrors.phone}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 rounded-2xl p-4 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                Gunakan email aktif dan nomor HP yang benar agar notifikasi reservasi dan akses akun tetap lancar.
              </div>

              <div className="md:col-span-2 pt-1 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button type="submit" disabled={!profileDirty || profileSaving} className="btn-primary w-full sm:w-auto">
                  {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                {profileDirty && (
                  <button
                    type="button"
                    className="btn-ghost w-full sm:w-auto"
                    onClick={() => {
                      setProfileForm(initialProfileForm);
                      setProfileErrors({});
                    }}
                  >
                    Batalkan Perubahan
                  </button>
                )}
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Password & Keamanan"
            subtitle="Form password yang lebih jelas, aman, dan tidak membingungkan saat diisi."
            icon="K"
            action={
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  color: passwordDirty ? "var(--warn)" : "var(--text-dim)",
                  background: passwordDirty
                    ? "color-mix(in srgb, var(--warn) 10%, transparent)"
                    : "var(--surface)",
                  border: `1px solid ${passwordDirty ? "color-mix(in srgb, var(--warn) 20%, transparent)" : "var(--border)"}`,
                }}
              >
                {passwordDirty ? "Form sedang diubah" : "Siap dipakai"}
              </span>
            }
          >
            <form onSubmit={requestPasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <PasswordField
                  label="Password Lama"
                  value={passwordForm.currentPassword}
                  error={passwordErrors.currentPassword}
                  visible={showPassword.currentPassword}
                  autoComplete="current-password"
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      currentPassword: !prev.currentPassword,
                    }))
                  }
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }));
                    setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
                  }}
                />
              </div>

              <div>
                <PasswordField
                  label="Password Baru"
                  value={passwordForm.newPassword}
                  error={passwordErrors.newPassword}
                  visible={showPassword.newPassword}
                  autoComplete="new-password"
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      newPassword: !prev.newPassword,
                    }))
                  }
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }));
                    setPasswordErrors((prev) => ({ ...prev, newPassword: "", confirm: "" }));
                  }}
                />
                {!passwordErrors.newPassword && <PasswordStrength password={passwordForm.newPassword} />}
              </div>

              <div>
                <PasswordField
                  label="Konfirmasi Password Baru"
                  value={passwordForm.confirm}
                  error={passwordErrors.confirm}
                  visible={showPassword.confirm}
                  autoComplete="new-password"
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }));
                    setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
                  }}
                />
              </div>

              <div
                className="md:col-span-2 rounded-2xl p-4 text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                Password baru sebaiknya menggunakan kombinasi huruf besar, angka, dan simbol agar lebih aman untuk login harian.
              </div>

              <div className="md:col-span-2 pt-1 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button type="submit" disabled={!passwordDirty || passwordSaving} className="btn-primary w-full sm:w-auto">
                  {passwordSaving ? "Memproses..." : "Ganti Password"}
                </button>
                {passwordDirty && (
                  <button
                    type="button"
                    className="btn-ghost w-full sm:w-auto"
                    onClick={() => {
                      setPasswordForm({ currentPassword: "", newPassword: "", confirm: "" });
                      setPasswordErrors({});
                    }}
                  >
                    Bersihkan Form
                  </button>
                )}
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

