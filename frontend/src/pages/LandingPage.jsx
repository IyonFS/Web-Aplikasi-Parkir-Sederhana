import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const PRESENTATION_MODULE_URL = "/presentation/index.html";

const featureItems = [
  {
    title: "Reservasi instan",
    description:
      "Pilih slot dalam hitungan detik, terbitkan tiket QR digital, dan pantau status parkir secara real-time.",
  },
  {
    title: "Tarif fleksibel",
    description:
      "Atur harga berdasarkan jenis kendaraan dan durasi parkir agar biaya selalu sesuai skema yang ditetapkan.",
  },
  {
    title: "Dashboard operasional",
    description:
      "Operator dapat memantau slot kosong, transaksi aktif, reservasi masuk, dan riwayat parkir dari satu layar.",
  },
  {
    title: "Analitik cerdas",
    description:
      "Lihat performa area, kepadatan jam sibuk, dan tren transaksi untuk keputusan operasional yang lebih cepat.",
  },
];

const workflowItems = [
  "Pengunjung memilih slot dan membuat reservasi melalui alur booking yang sederhana.",
  "Sistem membaca jenis kendaraan, menghitung tarif aktif, lalu menerbitkan tiket digital otomatis.",
  "Petugas memverifikasi tiket dan memantau transaksi aktif sampai kendaraan keluar dari area parkir.",
];

const statItems = [
  { value: "2.847+", label: "Slot dikelola" },
  { value: "99.9%", label: "Uptime simulasi" },
  { value: "< 1 ms", label: "Respon WebSocket" },
];

const testimonialItems = [
  {
    name: "Nyoman Ayu",
    role: "Operator Parkir",
    quote:
      "Tampilan reservasi dan transaksi mudah dipahami. Operator baru bisa cepat beradaptasi tanpa banyak training.",
  },
  {
    name: "Dewi Anggraini",
    role: "Admin Gedung",
    quote:
      "Pengaturan tarif jauh lebih enak dikelola karena harga reservasi mengikuti skema kendaraan yang aktif.",
  },
  {
    name: "Ahmad Fauzi",
    role: "IT Support",
    quote:
      "Landing page ini lebih cocok buat demo produk. Visualnya terasa seperti produk siap pakai, bukan halaman dokumentasi.",
  },
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <span
        className="inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
        style={{
          background: "rgba(0, 200, 150, 0.10)",
          border: "1px solid rgba(0, 200, 150, 0.24)",
          color: "#00c896",
        }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-semibold md:text-4xl" style={{ color: "#f3f7fb" }}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 md:text-lg" style={{ color: "#8ba3bf" }}>
        {description}
      </p>
    </div>
  );
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08101bdd]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black"
            style={{
              background: "linear-gradient(135deg, #19dcae 0%, #00c896 60%, #009f78 100%)",
              color: "#04131b",
              boxShadow: "0 12px 26px rgba(0, 200, 150, 0.22)",
            }}
          >
            P
          </span>
          <div>
            <p className="text-xl font-semibold" style={{ color: "#f3f7fb" }}>
              Hygiopark
            </p>
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "#4fd8b6" }}>
              Smart Parking
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex" style={{ color: "#8ba3bf" }}>
          <a href="#fitur">Fitur</a>
          <a href="#alur">Cara Kerja</a>
          <a href="#harga">Harga</a>
          <a href="#testimoni">Testimoni</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="btn-ghost">
            Masuk
          </Link>
          <a href={PRESENTATION_MODULE_URL} className="btn-primary">
            Lihat Module
          </a>
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-sm md:hidden"
          style={{ color: "#e2eaf5", background: "rgba(255,255,255,0.03)" }}
          onClick={() => setMobileOpen((value) => !value)}
        >
          Menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/5 px-4 py-4 md:hidden" style={{ background: "#08101b" }}>
          <div className="flex flex-col gap-3 text-sm" style={{ color: "#8ba3bf" }}>
            <a href="#fitur" onClick={() => setMobileOpen(false)}>
              Fitur
            </a>
            <a href="#alur" onClick={() => setMobileOpen(false)}>
              Cara Kerja
            </a>
            <a href="#harga" onClick={() => setMobileOpen(false)}>
              Harga
            </a>
            <a href="#testimoni" onClick={() => setMobileOpen(false)}>
              Testimoni
            </a>
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              Masuk
            </Link>
            <a href={PRESENTATION_MODULE_URL} onClick={() => setMobileOpen(false)}>
              Lihat Module
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ParkingHeroScene() {
  const sceneRef = useRef(null);

  const handleMove = (event) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    sceneRef.current.style.setProperty("--scene-rotate-x", `${(-y * 8).toFixed(2)}deg`);
    sceneRef.current.style.setProperty("--scene-rotate-y", `${(x * 10).toFixed(2)}deg`);
    sceneRef.current.style.setProperty("--scene-shift-x", `${(x * 16).toFixed(1)}px`);
    sceneRef.current.style.setProperty("--scene-shift-y", `${(y * 12).toFixed(1)}px`);
  };

  const handleLeave = () => {
    if (!sceneRef.current) return;
    sceneRef.current.style.setProperty("--scene-rotate-x", "0deg");
    sceneRef.current.style.setProperty("--scene-rotate-y", "0deg");
    sceneRef.current.style.setProperty("--scene-shift-x", "0px");
    sceneRef.current.style.setProperty("--scene-shift-y", "0px");
  };

  return (
    <div
      ref={sceneRef}
      className="landing-hero-visual"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="parking-orb parking-orb-a" />
      <div className="parking-orb parking-orb-b" />

      <div className="parking-road-scene">
        <div className="parking-road-shadow" />
        <div className="parking-road-stage">
          <div className="parking-road-glow" />
          <div className="parking-road-lane lane-left" />
          <div className="parking-road-lane lane-center" />
          <div className="parking-road-lane lane-right" />
          <div className="parking-road-dash dash-a" />
          <div className="parking-road-dash dash-b" />
          <div className="parking-road-dash dash-c" />
          <div className="parking-road-dash dash-d" />

          <div className="parking-floating-card float-top-left">
            <span className="parking-float-label">Smart Gate</span>
            <strong>QR Check-in aktif</strong>
          </div>

          <div className="parking-floating-card float-top-right">
            <span className="parking-float-label">Occupancy</span>
            <strong>78% area terisi</strong>
          </div>

          <div className="parking-floating-card float-bottom-center">
            <span className="parking-float-label">Reservasi</span>
            <strong>136 booking hari ini</strong>
          </div>

          <div className="parking-floating-card float-bottom-left">
            <span className="parking-float-label">Tarif Dinamis</span>
            <strong>Motor, mobil, visitor</strong>
          </div>

          <div className="parking-floating-card float-bottom-right">
            <span className="parking-float-label">Analytics</span>
            <strong>Peak hour 18.00</strong>
          </div>

          <div className="parking-moving-car moving-car-mint">
            <span className="moving-car-window" />
            <span className="moving-car-glow" />
          </div>
          <div className="parking-moving-car moving-car-gold">
            <span className="moving-car-window" />
            <span className="moving-car-glow" />
          </div>
          <div className="parking-moving-car moving-car-ice">
            <span className="moving-car-window" />
            <span className="moving-car-glow" />
          </div>
          <div className="parking-moving-bike moving-bike-dark">
            <span className="bike-rider" />
          </div>

          <div className="parking-signal-node signal-a" />
          <div className="parking-signal-node signal-b" />
          <div className="parking-signal-node signal-c" />
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(0,200,150,0.14), transparent 26%), linear-gradient(180deg, #06101c 0%, #0a0f1a 52%, #08111c 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,150,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,150,0.9) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:py-24">
        <div className="max-w-3xl">
          <span
            className="inline-flex rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              background: "rgba(0, 200, 150, 0.10)",
              border: "1px solid rgba(0, 200, 150, 0.24)",
              color: "#00c896",
            }}
          >
            Platform parkir pintar #1 Indonesia
          </span>

          <h1
            className="mt-7 text-4xl font-semibold leading-tight md:text-6xl"
            style={{ color: "#f3f7fb" }}
          >
            Kelola Parkir
            <br />
            <span style={{ color: "#00d7a1" }}>Lebih Cerdas</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: "#8ba3bf" }}>
            Sistem manajemen parkir real-time dengan WebSocket, QR Code tiket digital,
            dashboard operator, dan pengalaman reservasi yang mulus untuk gedung modern.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={PRESENTATION_MODULE_URL} className="btn-primary px-7 py-4 text-base">
              Lihat Module
            </a>
            <Link to="/login" className="btn-ghost px-7 py-4 text-base">
              Lihat Demo
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border p-5"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: "0 18px 42px rgba(0, 0, 0, 0.18)",
                }}
              >
                <p className="text-3xl font-semibold" style={{ color: "#00c896" }}>
                  {item.value}
                </p>
                <p className="mt-2 text-sm" style={{ color: "#8ba3bf" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ParkingHeroScene />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <SectionTitle
        eyebrow="Fitur utama"
        title="Semua yang dibutuhkan untuk parkir digital modern"
        description="Dari reservasi slot sampai transaksi aktif, Hygiopark membantu tim operasional bekerja lebih cepat dan lebih rapi."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {featureItems.map((item, index) => (
          <article
            key={item.title}
            className="rounded-[28px] border p-6"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: index % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,200,150,0.05)",
            }}
          >
            <div className="flex items-center gap-4">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold"
                style={{
                  background: "rgba(0,200,150,0.12)",
                  color: "#00c896",
                  border: "1px solid rgba(0,200,150,0.24)",
                }}
              >
                0{index + 1}
              </span>
              <h3 className="text-xl font-semibold" style={{ color: "#f3f7fb" }}>
                {item.title}
              </h3>
            </div>
            <p className="mt-4 text-base leading-7" style={{ color: "#8ba3bf" }}>
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="alur" className="border-y border-white/5 bg-[#08101a]">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <SectionTitle
          eyebrow="Cara kerja"
          title="Alur parkir yang sederhana untuk pengguna dan petugas"
          description="Booking lebih cepat, tarif lebih akurat, dan proses masuk-keluar kendaraan terasa lebih mulus."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {workflowItems.map((item, index) => (
            <div
              key={item}
              className="rounded-[28px] border p-6"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: "#4fd8b6" }}>
                Langkah 0{index + 1}
              </p>
              <p className="mt-4 text-base leading-7" style={{ color: "#d6dfeb" }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="harga" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <SectionTitle
        eyebrow="Harga dan tarif"
        title="Harga yang fleksibel untuk setiap jenis kendaraan"
        description="Atur tarif motor, mobil, dan kendaraan lain dengan skema yang sesuai kebutuhan area parkir Anda."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="rounded-[28px] border p-7"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <h3 className="text-2xl font-semibold" style={{ color: "#f3f7fb" }}>
            Keunggulan tarif Hygiopark
          </h3>
          <div className="mt-6 space-y-4">
            {[
              "Mendukung tarif berbeda untuk tiap jenis kendaraan.",
              "Perhitungan reservasi mengikuti harga aktif secara otomatis.",
              "Perubahan tarif bisa langsung dipakai untuk transaksi baru.",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: "#00c896" }} />
                <p className="text-base leading-7" style={{ color: "#8ba3bf" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-[28px] border p-7"
          style={{
            borderColor: "rgba(0,200,150,0.22)",
            background: "linear-gradient(180deg, rgba(0,200,150,0.08) 0%, rgba(255,255,255,0.03) 100%)",
          }}
        >
          <h3 className="text-2xl font-semibold" style={{ color: "#f3f7fb" }}>
            Mulai jelajahi produk
          </h3>
          <p className="mt-4 text-base leading-7" style={{ color: "#8ba3bf" }}>
            Buka module presentasi untuk melihat alur dan dokumentasi, atau masuk ke aplikasi untuk mencoba dashboard operasionalnya.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <a href={PRESENTATION_MODULE_URL} className="btn-primary justify-center">
              Buka Module
            </a>
            <Link to="/login" className="btn-ghost justify-center">
              Masuk ke aplikasi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimoni" className="border-t border-white/5 bg-[#08101a]">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <SectionTitle
          eyebrow="Testimoni"
          title="Dipercaya untuk operasional yang lebih tenang"
          description="Tim parkir, admin gedung, dan tim IT memakai Hygiopark untuk mempercepat layanan sekaligus menjaga data tetap rapi."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonialItems.map((item) => (
            <article
              key={item.name}
              className="rounded-[28px] border p-6"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <p className="text-base leading-7" style={{ color: "#d6dfeb" }}>
                "{item.quote}"
              </p>
              <div className="mt-6 border-t border-white/8 pt-4">
                <p className="font-semibold" style={{ color: "#f3f7fb" }}>
                  {item.name}
                </p>
                <p className="text-sm" style={{ color: "#8ba3bf" }}>
                  {item.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-6">
      <div
        className="overflow-hidden rounded-[32px] border"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          background:
            "radial-gradient(circle at top left, rgba(0,200,150,0.10), transparent 22%), rgba(255,255,255,0.025)",
        }}
      >
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] md:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-black"
                style={{
                  background: "linear-gradient(135deg, #19dcae 0%, #00c896 60%, #009f78 100%)",
                  color: "#04131b",
                }}
              >
                P
              </span>
              <div>
                <p className="text-xl font-semibold" style={{ color: "#f3f7fb" }}>
                  Hygiopark
                </p>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "#4fd8b6" }}>
                  Smart Parking
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7" style={{ color: "#8ba3bf" }}>
              Platform manajemen parkir digital untuk reservasi, tiket QR, tarif fleksibel,
              dan dashboard operasional real-time untuk gedung modern.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "#4fd8b6" }}>
              Navigasi
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "#8ba3bf" }}>
              <a href="#fitur">Fitur</a>
              <a href="#alur">Cara Kerja</a>
              <a href="#harga">Harga</a>
              <a href="#testimoni">Testimoni</a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "#4fd8b6" }}>
              Produk
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "#8ba3bf" }}>
              <span>Reservasi slot</span>
              <span>Tiket QR digital</span>
              <span>Tarif kendaraan</span>
              <span>Dashboard operator</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: "#4fd8b6" }}>
              Akses Cepat
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <a href={PRESENTATION_MODULE_URL} className="btn-primary justify-center">
                Lihat Module
              </a>
              <Link to="/login" className="btn-ghost justify-center">
                Masuk
              </Link>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col gap-3 border-t px-6 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-8"
          style={{ borderColor: "rgba(255,255,255,0.06)", color: "#8ba3bf" }}
        >
          <p>© 2026 Hygiopark. Sistem parkir digital untuk operasional yang lebih tenang.</p>
          <div className="flex gap-4">
            <span>2.847+ slot</span>
            <span>99.9% uptime</span>
            <span>QR Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-shell" style={{ background: "#0a0f1a", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
      <Pricing />
      <Testimonials />
      <Footer />
    </div>
  );
}
