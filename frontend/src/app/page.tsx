"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════
   Locomotive Scroll v5 — smooth scroll
   ═══════════════════════════════════════════════════════ */
function useLocoScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let scroll: { destroy: () => void } | null = null;
    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      scroll = new LocomotiveScroll({
        el: ref.current!,
        smooth: true,
        smartphone: { smooth: true },
        tablet: { smooth: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    })();
    return () => scroll?.destroy();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════════════
   Scroll-triggered reveal
   ═══════════════════════════════════════════════════════ */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(.19,1,.22,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Animated counter
   ═══════════════════════════════════════════════════════ */
function useCountUp(end: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setValue(Math.round((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return { value, ref };
}

/* ═══════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: "Wallet", href: "#wallet" },
  { label: "Transfers", href: "#features" },
  { label: "Payouts", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

const QUICK_ACTIONS = [
  { label: "Accept Payments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Send Money", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { label: "Make Payouts", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { label: "Go Premium", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { label: "View History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Something else?", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
];

const BRANDS = ["airbnb", "facebook", "WhatsApp", "airtel", "CRED", "BookMyShow", "OLA", "zomato", "blinkit", "zepto"];

const FEATURES = [
  {
    icon: "M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4z",
    title: "Digital Wallet",
    desc: "Instant top-ups via UPI, cards, or net banking. Your wallet is always ready to transact.",
  },
  {
    icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    title: "Instant Transfers",
    desc: "Send money to any NeoBank user in under 5 seconds. Zero fees, every time.",
  },
  {
    icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    title: "Easy Payouts",
    desc: "Withdraw to any Indian bank account. Fast processing with real-time status tracking.",
  },
  {
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
    title: "Bank-Grade Security",
    desc: "256-bit encryption, JWT authentication, and mandatory OTP verification.",
  },
  {
    icon: "M6 3h12l4 6-10 13L2 9zM2 9h20",
    title: "Premium Perks",
    desc: "Higher limits, zero payout fees, priority support, and advanced analytics.",
  },
  {
    icon: "M3 3v18h18M19 9l-5 5-4-4-3 3",
    title: "Live Analytics",
    desc: "Beautiful charts showing revenue, volume, and spending patterns in real time.",
  },
];

const STEPS = [
  { num: "01", title: "Create Account", desc: "Sign up with email & verify via OTP. Under 2 minutes." },
  { num: "02", title: "Add Money", desc: "Top up your wallet using UPI, debit card, or net banking." },
  { num: "03", title: "Start Transacting", desc: "Send transfers, request payouts, or upgrade to Premium." },
];

/* ═══════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const scrollRef = useLocoScroll();
  const [navShadow, setNavShadow] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const fn = () => setNavShadow(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const users = useCountUp(50000);
  const volume = useCountUp(10);
  const uptime = useCountUp(999);
  const speed = useCountUp(5);

  return (
    <div ref={scrollRef} className="bg-white antialiased">
      {/* ──────────────────────────────────────────────
          NAVBAR — always white, Razorpay style
      ────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-[100] bg-white transition-shadow duration-300 ${
          navShadow ? "shadow-[0_2px_8px_rgba(0,0,0,.06)]" : ""
        }`}
      >
        <nav className="max-w-[1280px] mx-auto px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7V4a1 1 0 00-1-1H5a2 2 0 000 4h15a1 1 0 011 1v4h-3a2 2 0 000 4h3a1 1 0 001-1v-2a1 1 0 00-1-1" />
                </svg>
              </div>
              <span className="font-bold text-[18px] text-slate-900 tracking-tight">NeoBank</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="h-9 px-5 text-[13px] font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="h-9 px-5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5">
                Sign Up
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ──────────────────────────────────────────────
          HERO — White bg, blue accent triangle, Razorpay style
      ────────────────────────────────────────────── */}
      <section className="relative pt-[64px] overflow-hidden bg-white">
        {/* Blue geometric accent on right — the Razorpay triangle */}
        <div className="absolute top-0 right-0 w-[55%] h-full hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-600 via-blue-500 to-blue-400" style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 12% 100%)" }} />
          {/* Subtle light strip */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 12% 100%)" }} />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-14 pb-8 lg:pt-20 lg:pb-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[460px]">
            {/* Left — text content */}
            <div className="relative z-10">
              <h1
                className={`transition-all duration-[900ms] ease-[cubic-bezier(.19,1,.22,1)] ${
                  heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <span className="block text-[clamp(36px,5vw,52px)] font-bold leading-[1.1] tracking-tight text-blue-600">
                  Smart Digital Banking
                </span>
                <span className="block text-[clamp(36px,5vw,52px)] font-bold leading-[1.1] tracking-tight text-slate-900 mt-1">
                  for India&apos;s next generation
                </span>
              </h1>

              <p
                className={`mt-5 text-[15px] text-slate-500 transition-all duration-[900ms] delay-200 ease-[cubic-bezier(.19,1,.22,1)] ${
                  heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                Instant Transfers&ensp;|&ensp;Secure Wallet&ensp;|&ensp;Real-time Analytics
              </p>

              <div
                className={`mt-8 flex flex-wrap items-center gap-4 transition-all duration-[900ms] delay-[350ms] ease-[cubic-bezier(.19,1,.22,1)] ${
                  heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <Link href="/signup">
                  <Button className="h-11 px-7 text-[14px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2 shadow-md shadow-blue-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:-translate-y-0.5">
                    Sign Up Now
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Button>
                </Link>
                <a href="#features" className="text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Know More
                </a>
              </div>
            </div>

            {/* Right — Dashboard mockup card floating over blue triangle */}
            <div
              className={`relative z-10 hidden lg:flex justify-end transition-all duration-[1100ms] delay-200 ease-[cubic-bezier(.19,1,.22,1)] ${
                heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <div className="w-[400px] rounded-2xl bg-white shadow-2xl shadow-blue-900/10 border border-slate-200/60 overflow-hidden" data-scroll data-scroll-speed="-0.5">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-600 grid place-items-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M19 7V4a1 1 0 00-1-1H5a2 2 0 000 4h15a1 1 0 011 1v4h-3a2 2 0 000 4h3a1 1 0 001-1v-2a1 1 0 00-1-1" /></svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">NeoBank</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                {/* Balance */}
                <div className="px-5 pt-5 pb-3">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Balance</p>
                  <p className="text-[26px] font-bold text-slate-900 mt-0.5">{"\u20B9"}1,07,843<span className="text-[16px] text-slate-400">.82</span></p>
                  <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    +12.5%
                  </span>
                </div>
                {/* Mini chart */}
                <div className="px-5 pb-2">
                  <svg viewBox="0 0 360 70" className="w-full h-auto">
                    <defs>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 55 Q40 48 80 42 T160 30 T240 22 T320 18 T360 8 V70 H0Z" fill="url(#hg)" />
                    <path d="M0 55 Q40 48 80 42 T160 30 T240 22 T320 18 T360 8" fill="none" stroke="#2563eb" strokeWidth="2" />
                  </svg>
                </div>
                {/* Transactions */}
                <div className="px-5 pb-5 space-y-1">
                  {[
                    { label: "UPI Top Up", amount: "+\u20B95,000", positive: true, time: "2 min ago" },
                    { label: "Transfer to Rahul", amount: "-\u20B91,200", positive: false, time: "1 hour ago" },
                    { label: "Bank Payout", amount: "-\u20B93,000", positive: false, time: "Yesterday" },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${tx.positive ? "bg-emerald-50" : "bg-slate-50"} grid place-items-center`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${tx.positive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-700">{tx.label}</p>
                          <p className="text-[9px] text-slate-400">{tx.time}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold ${tx.positive ? "text-emerald-600" : "text-slate-600"}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions Bar (Razorpay-style floating) ──── */}
        <div
          className={`relative z-20 max-w-[1100px] mx-auto px-6 lg:px-8 -mb-7 transition-all duration-[900ms] delay-[500ms] ease-[cubic-bezier(.19,1,.22,1)] ${
            heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200/80 px-5 py-4 flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-slate-400 pr-4 border-r border-slate-200 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span className="text-[13px] font-medium">Get recommendations</span>
            </div>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} href={
                a.label === "Send Money" ? "/dashboard/transfer" :
                a.label === "Accept Payments" ? "/dashboard/topup" :
                a.label === "Make Payouts" ? "/dashboard/payout" :
                a.label === "Go Premium" ? "/dashboard/premium" :
                a.label === "View History" ? "/dashboard/history" :
                "/dashboard"
              }>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 transition-all text-[13px] font-medium text-slate-600 hover:text-blue-600 whitespace-nowrap cursor-pointer shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
                  {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          TRUSTED BY — brand logos
      ────────────────────────────────────────────── */}
      <section className="pt-20 pb-10 bg-white">
        <Reveal>
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between gap-6 lg:gap-10 overflow-x-auto">
              {BRANDS.map((name) => (
                <span key={name} className="text-[17px] font-bold text-slate-300 tracking-tight whitespace-nowrap select-none shrink-0">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ──────────────────────────────────────────────
          STATS
      ────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { ref: users.ref, val: `${users.value.toLocaleString("en-IN")}+`, label: "Active Users" },
            { ref: volume.ref, val: `\u20B9${volume.value} Cr+`, label: "Processed" },
            { ref: uptime.ref, val: `${(uptime.value / 10).toFixed(1)}%`, label: "Uptime SLA" },
            { ref: speed.ref, val: `<${speed.value}s`, label: "Transfer Speed" },
          ].map((s, i) => (
            <div key={i} ref={s.ref} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">{s.val}</p>
              <p className="mt-1.5 text-[13px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FEATURES
      ────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mb-16">
              <p className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest mb-4">Features</p>
              <h2 className="text-[clamp(30px,4vw,44px)] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Everything you need to<br />manage your money
              </h2>
              <p className="mt-4 text-[16px] text-slate-500 leading-relaxed">
                From instant transfers to premium banking — NeoBank has you covered.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group p-7 rounded-2xl bg-slate-50/70 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/80 transition-all duration-500 cursor-default h-full">
                  <div className="w-11 h-11 rounded-xl bg-white group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200 grid place-items-center transition-all duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                  </div>
                  <h3 className="mt-5 text-[17px] font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          SHOWCASE — light split with dashboard preview
      ────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest mb-4">Your Dashboard</p>
                <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-slate-900 leading-[1.15] tracking-tight">
                  Your command center<br />for every transaction.
                </h2>
                <p className="mt-5 text-[16px] text-slate-500 leading-relaxed max-w-md">
                  Real-time balance, full transaction history, analytics, and quick actions — all in a clean, modern interface built for speed.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {["Real-time Updates", "Smart Charts", "Quick Actions", "Secure & Private"].map((tag) => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="relative" data-scroll data-scroll-speed="0.3">
                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-lg shadow-slate-200/50">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Balance", val: "\u20B91,07,843", color: "text-blue-600" },
                      { label: "Income", val: "\u20B923,500", color: "text-emerald-600" },
                      { label: "Spent", val: "\u20B98,200", color: "text-amber-600" },
                    ].map((c) => (
                      <div key={c.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{c.label}</p>
                        <p className={`text-[15px] font-bold ${c.color} mt-0.5`}>{c.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Revenue Overview</span>
                      <span className="text-[10px] text-slate-400">Last 7 days</span>
                    </div>
                    <svg viewBox="0 0 400 90" className="w-full h-auto">
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 70 Q50 60 100 50 T200 35 T300 20 T400 12 V90 H0Z" fill="url(#cg)" />
                      <path d="M0 70 Q50 60 100 50 T200 35 T300 20 T400 12" fill="none" stroke="#2563eb" strokeWidth="2" />
                      <circle cx="400" cy="12" r="3.5" fill="#2563eb" />
                    </svg>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    {["Send", "Top Up", "Payout", "History"].map((a) => (
                      <div key={a} className="flex-1 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center text-[10px] font-semibold text-slate-500">
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          HOW IT WORKS
      ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-20">
              <p className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest mb-4">How it Works</p>
              <h2 className="text-[clamp(30px,4vw,44px)] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Get started in 3 simple steps
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-0">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="relative text-center px-8 py-10">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-[52px] right-0 w-1/2 h-px bg-slate-200" />
                  )}
                  {i > 0 && (
                    <div className="hidden md:block absolute top-[52px] left-0 w-1/2 h-px bg-slate-200" />
                  )}
                  <div className="relative z-10 w-14 h-14 rounded-full bg-blue-600 grid place-items-center text-white text-[17px] font-bold mx-auto mb-6 shadow-lg shadow-blue-600/20">
                    {s.num}
                  </div>
                  <h3 className="text-[18px] font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          PRICING
      ────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest mb-4">Pricing</p>
              <h2 className="text-[clamp(30px,4vw,44px)] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-[16px] text-slate-500">Start free. Upgrade when you&apos;re ready.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Reveal>
              <div className="p-8 rounded-2xl border border-slate-200 bg-white h-full">
                <h3 className="text-xl font-bold text-slate-900">Free</h3>
                <p className="mt-1 text-[14px] text-slate-500">Perfect for getting started</p>
                <div className="mt-6">
                  <span className="text-[44px] font-bold text-slate-900">{"\u20B9"}0</span>
                  <span className="text-slate-400 ml-1">/month</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {["Unlimited wallet balance", "Instant P2P transfers", "Bank payouts (\u20B910 fee)", "Basic transaction history", "Email support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-8">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-slate-300 text-slate-700 font-semibold text-[14px] hover:bg-slate-50">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="relative p-8 rounded-2xl border-2 border-blue-600 bg-white h-full">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold tracking-wide">
                  MOST POPULAR
                </div>
                <h3 className="text-xl font-bold text-slate-900">Premium</h3>
                <p className="mt-1 text-[14px] text-slate-500">For power users</p>
                <div className="mt-6">
                  <span className="text-[44px] font-bold text-blue-600">{"\u20B9"}299</span>
                  <span className="text-slate-400 ml-1">/one-time</span>
                </div>
                <ul className="mt-8 space-y-3.5">
                  {["Everything in Free, plus:", "Zero bank payout fees", "Higher transaction limits", "Priority processing", "Advanced analytics", "24/7 priority support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-8">
                  <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px]">
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          CTA
      ────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-[clamp(30px,4.5vw,46px)] font-bold text-slate-900 leading-[1.1] tracking-tight">
              Supercharge your finances<br />with NeoBank
            </h2>
            <p className="mt-5 text-[16px] text-slate-500 max-w-lg mx-auto leading-relaxed">
              Join thousands who already trust NeoBank for instant transfers, smart payouts, and premium banking.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button className="h-12 px-8 text-[15px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5">
                  Get Started Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-[13px] text-slate-500">
              {["Free forever plan", "No hidden fees", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 pt-14 pb-10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 7V4a1 1 0 00-1-1H5a2 2 0 000 4h15a1 1 0 011 1v4h-3a2 2 0 000 4h3a1 1 0 001-1v-2a1 1 0 00-1-1" /></svg>
                </div>
                <span className="font-bold text-[17px] text-slate-900">NeoBank</span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs">
                India&apos;s fastest-growing digital wallet. Instant transfers, smart payouts, and premium banking — all in one place.
              </p>
              <div className="flex items-center gap-4 mt-5">
                {[
                  "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                  "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.28-.03-.56-.08-.83A7.72 7.72 0 0023 3z",
                  "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z",
                ].map((d, i) => (
                  <a key={i} href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "PRODUCT", links: ["Wallet", "Transfers", "Payouts", "Premium", "Analytics"] },
              { title: "RESOURCES", links: ["Documentation", "API Reference", "Blog", "Support", "Status"] },
              { title: "COMPANY", links: ["About Us", "Careers", "Press", "Contact", "Partners"] },
              { title: "LEGAL", links: ["Privacy Policy", "Terms of Use", "Security", "Compliance"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-[13px] text-slate-600 hover:text-blue-600 transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[12px] text-slate-400">&copy; 2026 NeoBank. All rights reserved.</p>
            <div className="flex items-center gap-6 text-[12px] text-slate-400">
              <Link href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-600 transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
