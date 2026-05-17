import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePassword } from "../lib/format";

const demos = [
  { label: "Admin", email: "admin@hygiopark.io", color: "#10b981" },
  { label: "Petugas", email: "operator@hygiopark.io", color: "#3b82f6" },
  { label: "Owner", email: "user@hygiopark.io", color: "#f59e0b" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const nextErrors = {};
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    if (emailErr) nextErrors.email = emailErr;
    if (passErr) nextErrors.password = passErr;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setApiError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/app/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.error || "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: "password123" });
    setErrors({});
    setApiError("");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(180deg, #050c18 0%, #0a0f1a 60%, #0a0f1a 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#00c896 1px, transparent 1px), linear-gradient(90deg, #00c896 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute top-16 left-10 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,200,150,0.22), transparent 72%)",
        }}
      />
      <div
        className="absolute bottom-24 right-16 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,163,122,0.16), transparent 72%)",
        }}
      />

      <div className="relative w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color: "#cbd5e1",
              background: "rgba(15, 23, 42, 0.58)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)",
            }}
            title="Kembali ke landing page"
          >
            <span aria-hidden="true">&lt;</span>
            Kembali ke Landing Page
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-6"
            style={{
              background: "#00c896",
              color: "#0a0f1a",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            P
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#f8fafc" }}>
            Hygiopark
          </h1>
          <p className="text-sm" style={{ color: "#cbd5e1" }}>
            Smart Parking System
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-3xl p-10 mb-6 backdrop-blur-xl"
          style={{
            background: "rgba(7, 14, 26, 0.90)",
            border: "1px solid rgba(0, 200, 150, 0.12)",
          }}
        >
          {apiError && (
            <div
              className="rounded-xl px-4 py-3 mb-6 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fecaca",
              }}
            >
              {apiError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
            autoComplete="on"
          >
            {/* Email Input */}
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "#cbd5e1" }}
              >
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="admin@hygiopark.io"
                value={form.email}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                  setErrors((prev) => ({ ...prev, email: "" }));
                  setApiError("");
                }}
                className="w-full px-4 py-3 rounded-xl text-sm backdrop-blur-sm transition-colors"
                style={{
                  background: "rgba(51, 65, 85, 0.5)",
                  border: errors.email
                    ? "1px solid #ef4444"
                    : "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#f8fafc",
                }}
                autoComplete="username"
              />
              {errors.email && (
                <p className="text-xs mt-1.5" style={{ color: "#fecaca" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "#cbd5e1" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, password: e.target.value }));
                    setErrors((prev) => ({ ...prev, password: "" }));
                    setApiError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl text-sm backdrop-blur-sm transition-colors pr-12"
                  style={{
                    background: "rgba(51, 65, 85, 0.5)",
                    border: errors.password
                      ? "1px solid #ef4444"
                      : "1px solid rgba(148, 163, 184, 0.2)",
                    color: "#f8fafc",
                  }}
                  name="password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "#94a3b8" }}
                >
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5" style={{ color: "#fecaca" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm uppercase tracking-wide transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#f8fafc",
              }}
            >
              {loading ? "Sedang masuk..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div>
          <p
            className="text-xs font-semibold mb-3 uppercase tracking-wide text-center"
            style={{ color: "#94a3b8" }}
          >
            Akun Demo (password123)
          </p>
          <div className="grid grid-cols-3 gap-3">
            {demos.map((demo) => (
              <button
                key={demo.label}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="rounded-xl px-3 py-3 text-center text-xs font-semibold transition-all duration-200 backdrop-blur-sm hover:scale-105"
                style={{
                  background: `rgba(${parseInt(demo.color.slice(1, 3), 16)}, ${parseInt(demo.color.slice(3, 5), 16)}, ${parseInt(demo.color.slice(5, 7), 16)}, 0.15)`,
                  border: `1px solid ${demo.color}40`,
                  color: demo.color,
                }}
                title={demo.email}
              >
                <div className="text-lg mb-1" style={{ opacity: 0.7 }}>
                  {demo.label.charAt(0)}
                </div>
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center mt-8" style={{ color: "#64748b" }}>
          Aplikasi sistem parkir untuk keperluan ujian HYGIONXXIPPLG3
        </p>
      </div>
    </div>
  );
}


