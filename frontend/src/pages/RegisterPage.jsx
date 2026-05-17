import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePassword } from "../lib/format";

function StrengthBar({ password }) {
  if (!password) return null;
  const score = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const color =
    score <= 1 ? "var(--danger)" : score <= 3 ? "var(--warn)" : "var(--accent)";
  const label = ["", "Lemah", "Lemah", "Sedang", "Kuat", "Sangat kuat"][score];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-1 flex-1 rounded-full"
            style={{ background: item <= score ? color : "var(--border)" }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const validateStep = (targetStep) => {
    const nextErrors = {};
    if (targetStep >= 1) {
      if (!form.name.trim() || form.name.trim().length < 2)
        nextErrors.name = "Nama minimal 2 karakter";
      const emailError = validateEmail(form.email);
      if (emailError) nextErrors.email = emailError;
    }
    if (targetStep >= 2) {
      const passwordError = validatePassword(form.password);
      if (passwordError) nextErrors.password = passwordError;
      if (form.password !== form.confirm)
        nextErrors.confirm = "Konfirmasi password tidak cocok";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(2)) return;
    setApiError("");
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/app/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.error || "Registrasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #eef4fb 0%, #f8fbfd 45%, #eef8f3 100%)",
      }}
    >
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
        <div
          className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] rounded-[32px] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(148,163,184,0.22)",
            boxShadow: "0 30px 110px rgba(15, 23, 42, 0.14)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="relative hidden lg:flex flex-col justify-between p-10 xl:p-12"
            style={{
              background:
                "linear-gradient(155deg, #0f172a 0%, #0c2340 58%, #0d1b2d 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div
              className="absolute -top-12 right-0 w-60 h-60 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0) 72%)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-72 h-72 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(96,165,250,0.16) 0%, rgba(96,165,250,0) 72%)",
              }}
            />

            <div className="relative z-10 max-w-xl">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-3xl font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#34d399",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                P
              </div>
              <p
                className="text-xs uppercase tracking-[0.24em] mt-6"
                style={{ color: "#6ee7b7" }}
              >
                Buat Akun Baru
              </p>
              <h1
                className="font-display text-5xl leading-[1.05] mt-4"
                style={{ color: "#f8fafc" }}
              >
                Siapkan akun untuk masuk ke sistem parkir.
              </h1>
              <p
                className="text-base leading-7 mt-5 max-w-lg"
                style={{ color: "#c9d5e5" }}
              >
                Form ini disusun ringkas, jelas, dan tetap layak untuk
                presentasi pada desktop maupun mobile.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-3 max-w-xl">
              {[
                ["Langkah 1", "Isi identitas akun dengan nama dan email."],
                ["Langkah 2", "Lengkapi password dan validasi konfirmasi."],
                [
                  "Hasil",
                  "Akun siap digunakan untuk mengakses modul sesuai peran.",
                ],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#f8fafc" }}
                  >
                    {title}
                  </p>
                  <p
                    className="text-xs leading-5 mt-1"
                    style={{ color: "#c9d5e5" }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative p-8 sm:p-10 md:p-12 xl:p-14">
            <div className="lg:hidden mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-2xl font-bold"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent) 14%, transparent)",
                  color: "var(--accent)",
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                }}
              >
                P
              </div>
              <h1
                className="font-display text-3xl mt-5"
                style={{ color: "var(--text)" }}
              >
                Buat Akun
              </h1>
              <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                Lengkapi data akun untuk masuk ke sistem parkir.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.22em]"
                    style={{ color: "var(--accent)" }}
                  >
                    Daftar Akun Gratis
                  </p>
                  <h2
                    className="font-display text-4xl mt-3"
                    style={{ color: "var(--text)" }}
                  >
                    Buat Akun Hygiopark
                  </h2>
                  <p
                    className="text-sm mt-2"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Pendaftaran akun gratis untuk mulai mengelola parkir. Paket
                    langganan bisa dipilih nanti setelah masuk.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        background:
                          step >= item
                            ? "var(--accent)"
                            : "rgba(255,255,255,0.75)",
                        color: step >= item ? "#04121c" : "var(--text-dim)",
                        border: `1px solid ${step >= item ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "rgba(148,163,184,0.22)"}`,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[28px] p-6 sm:p-8"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247,250,252,0.94))",
                  border: "1px solid rgba(148,163,184,0.22)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
                }}
              >
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {step === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="label">Nama Lengkap</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="Nama Anda"
                          value={form.name}
                          onChange={updateField("name")}
                          style={
                            errors.name ? { borderColor: "var(--danger)" } : {}
                          }
                        />
                        {errors.name && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--danger)" }}
                          >
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input
                          className="input"
                          type="email"
                          placeholder="kamu@example.com"
                          value={form.email}
                          onChange={updateField("email")}
                          style={
                            errors.email ? { borderColor: "var(--danger)" } : {}
                          }
                        />
                        {errors.email && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--danger)" }}
                          >
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="label">Password</label>
                        <input
                          className="input"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={form.password}
                          onChange={updateField("password")}
                          style={
                            errors.password
                              ? { borderColor: "var(--danger)" }
                              : {}
                          }
                        />
                        {errors.password ? (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--danger)" }}
                          >
                            {errors.password}
                          </p>
                        ) : (
                          <StrengthBar password={form.password} />
                        )}
                      </div>
                      <div>
                        <label className="label">Konfirmasi Password</label>
                        <input
                          className="input"
                          type="password"
                          placeholder="Ulangi password"
                          value={form.confirm}
                          onChange={updateField("confirm")}
                          style={
                            errors.confirm
                              ? { borderColor: "var(--danger)" }
                              : {}
                          }
                        />
                        {errors.confirm && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--danger)" }}
                          >
                            {errors.confirm}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {apiError && (
                    <div
                      className="px-4 py-3 rounded-2xl text-sm"
                      style={{
                        background:
                          "color-mix(in srgb, var(--danger) 10%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--danger) 24%, transparent)",
                        color: "var(--danger)",
                      }}
                    >
                      {apiError}
                    </div>
                  )}

                  <div
                    className="rounded-3xl p-4 mb-4"
                    style={{
                      background: "rgba(15, 23, 42, 0.04)",
                      border: "1px solid rgba(148,163,184,0.16)",
                      color: "var(--text-dim)",
                    }}
                  >
                    <p className="text-sm">
                      Ini adalah pendaftaran akun Hygiopark. Setelah membuat
                      akun, Anda bisa masuk dan memilih paket di dashboard.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    {step === 2 ? (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-ghost flex-1 py-3"
                      >
                        Kembali
                      </button>
                    ) : (
                      <Link
                        to="/"
                        className="btn-ghost flex-1 py-3 text-center"
                        title="Lihat demo landing page Hygiopark"
                      >
                        Lihat Demo
                      </Link>
                    )}

                    {step === 1 ? (
                      <button
                        type="button"
                        onClick={() => validateStep(1) && setStep(2)}
                        className="btn-primary flex-1 py-3"
                      >
                        Lanjut
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                      >
                        {loading && (
                          <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        )}
                        Buat Akun Gratis
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <p
                className="text-center text-sm mt-6"
                style={{ color: "var(--text-dim)" }}
              >
                Sudah punya akun? Masuk ke akun Anda.
                <Link
                  to="/login"
                  className="hover:underline font-semibold ml-1"
                  style={{ color: "var(--accent)" }}
                >
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


