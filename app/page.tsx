import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { Spotlight } from "@/components/Spotlight";

const categories = [
  "Braids",
  "Cornrows",
  "Locs",
  "Wigs",
  "Ankara",
  "Evening Wear",
  "Suits",
  "Streetwear",
  "Bridal",
];

const features = [
  {
    eyebrow: "Virtual Try-On",
    title: "Try it on, instantly.",
    desc: "Upload a selfie and any outfit — ZDC renders a photorealistic try-on in seconds, so you see the fit, drape and colour before you buy.",
    img: "/images/model-print.png",
    cta: "Try apparel",
    reverse: false,
  },
  {
    eyebrow: "Hair Studio",
    title: "Every hairstyle, previewed.",
    desc: "Braids, cornrows, locs, pleats and wigs — visualize any style on yourself before your appointment. No more guesswork at the salon.",
    img: "/images/braids-light.png",
    cta: "Try hairstyles",
    reverse: true,
  },
  {
    eyebrow: "For Business",
    title: "A fitting room for your catalog.",
    desc: "Boutiques and salons upload their catalog, and customers try everything on. Cut returns, lift conversion, and see which styles win.",
    img: "/images/flatlay.png",
    cta: "Explore B2B",
    reverse: false,
  },
];

const steps = [
  { n: "01", title: "Upload", desc: "Add a selfie and the outfit or hairstyle you want to try." },
  { n: "02", title: "Pay", desc: "One tap via M-Pesa — pay only for what you render." },
  { n: "03", title: "Reveal", desc: "Your try-on lands instantly in WhatsApp or email." },
];

export default function Home() {
  return (
    <main className="relative">
      {/* ============ NAV ============ */}
      <header className="fixed inset-x-0 top-0 z-50 px-4">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-3">
          <Link href="#" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage">
              <span className="h-2.5 w-2.5 rounded-full bg-paper" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              ZDC
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#lookbook" className="transition hover:text-ink">Lookbook</a>
            <a href="#how" className="transition hover:text-ink">How it Works</a>
            <a href="#pricing" className="transition hover:text-ink">Pricing</a>
          </nav>
          <Link
            href="#how"
            className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-paper transition hover:bg-sage-dark"
          >
            Try On Instantly
          </Link>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <Spotlight>
        <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-36 md:grid-cols-[1fr_1fr] md:pt-44">
          <Reveal className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-4 py-1.5 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              AI Virtual Try-On • Built for Africa
            </div>

            <h1 className="mt-6 font-display text-6xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-7xl">
              Wear the{" "}
              <span className="italic text-sage">Future.</span>
              <br />
              Now.
            </h1>

            <p className="mt-6 max-w-md text-lg text-ink-muted">
              Visualize any outfit or hairstyle on yourself before you spend a
              shilling. Photorealistic try-ons, delivered in seconds.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="#how"
                className="rounded-full bg-sage px-8 py-3.5 text-base font-semibold text-paper shadow-lg shadow-sage/20 transition hover:bg-sage-dark"
              >
                Try On Instantly
              </Link>
              <a
                href="#lookbook"
                className="rounded-full border border-ink/15 px-8 py-3.5 text-base font-semibold text-ink transition hover:border-ink/30 hover:bg-white/40"
              >
                View the lookbook
              </a>
            </div>

            <div className="mt-10 flex items-center gap-8">
              {[
                ["~8s", "Render time"],
                ["WhatsApp", "Instant delivery"],
                ["M-Pesa", "Easy payments"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-xl font-semibold text-ink">{v}</div>
                  <div className="text-xs text-ink-muted">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Hero collage */}
          <Reveal delay={140} className="relative z-10">
            <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-4">
              <div className="card row-span-2 overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[3/4.4]">
                  <Image
                    src="/images/model-print.png"
                    alt="On-model Ankara try-on"
                    fill
                    priority
                    sizes="(max-width: 768px) 45vw, 300px"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="card overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-square">
                  <Image
                    src="/images/braids-light.png"
                    alt="Braids hairstyle try-on"
                    fill
                    sizes="(max-width: 768px) 45vw, 260px"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="card overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-square">
                  <Image
                    src="/images/bag.png"
                    alt="Accessory"
                    fill
                    sizes="(max-width: 768px) 45vw, 260px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="absolute -left-4 bottom-6 flex items-center gap-3 rounded-2xl glass-strong px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage text-sm text-paper">
                ✓
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Rendered in 8s</div>
                <div className="text-xs text-ink-muted">98% match confidence</div>
              </div>
            </div>
          </Reveal>
        </section>
      </Spotlight>

      {/* ============ CATEGORY STRIP ============ */}
      <section className="border-y border-ink/10 bg-white/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-6 text-sm text-ink-muted">
          {categories.map((c) => (
            <span key={c} className="font-display text-lg italic">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ============ FEATURE ROWS ============ */}
      <section id="features" className="mx-auto max-w-6xl space-y-24 px-6 py-28">
        {features.map((f) => (
          <Reveal key={f.title}>
            <div
              className={`grid items-center gap-10 md:grid-cols-2 ${
                f.reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                  {f.eyebrow}
                </p>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  {f.title}
                </h2>
                <p className="mt-5 max-w-md text-lg text-ink-muted">{f.desc}</p>
                <div className="mt-8 flex items-center gap-6">
                  <a
                    href="#how"
                    className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50"
                  >
                    {f.cta}
                  </a>
                  <a
                    href="#how"
                    className="text-sm font-semibold text-sage transition hover:text-sage-dark"
                  >
                    Learn more →
                  </a>
                </div>
              </div>

              <div className="card overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={f.img}
                    alt={f.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 520px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ============ LOOKBOOK ============ */}
      <section id="lookbook" className="border-y border-ink/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal className="flex flex-col items-end justify-between gap-6 sm:flex-row">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
                The Lookbook
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                Real renders. Runway-ready results.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-muted">
              A glimpse of the photorealistic output ZDC delivers — apparel,
              hairstyles and accessories.
            </p>
          </Reveal>

          <div className="mt-14 grid auto-rows-[240px] grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { src: "/images/model-print.png", tag: "Ankara Couture", kind: "Apparel", cls: "row-span-2" },
              { src: "/images/cornrows-light.png", tag: "Cornrows", kind: "Hairstyle", cls: "" },
              { src: "/images/bag.png", tag: "Accessories", kind: "Product", cls: "" },
              { src: "/images/braids-light.png", tag: "Box Braids", kind: "Hairstyle", cls: "row-span-2" },
              { src: "/images/flatlay.png", tag: "Full Look", kind: "Styling", cls: "" },
            ].map((item, i) => (
              <Reveal key={item.src} delay={i * 80} className={item.cls}>
                <div className="card group relative h-full w-full overflow-hidden rounded-3xl">
                  <Image
                    src={item.src}
                    alt={item.tag}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute inset-x-4 bottom-4 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="text-[10px] uppercase tracking-widest text-paper/80">
                      {item.kind}
                    </span>
                    <div className="font-display text-xl font-semibold text-paper">
                      {item.tag}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
            Three taps
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
            From selfie to showstopper.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-14 hidden h-px bg-ink/10 md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="card relative flex h-full flex-col rounded-3xl p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage font-display text-lg font-semibold text-paper">
                  {s.n}
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-ink-muted">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ B2B ============ */}
      <section id="business" className="border-y border-ink/10 bg-white/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 md:grid-cols-2">
          <Reveal className="relative order-2 md:order-1">
            <div className="card overflow-hidden rounded-[2rem]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/boutique.png"
                  alt="Boutique and salon dashboard"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-4 w-56 rounded-2xl glass-strong p-5 sm:-right-8">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">This week</span>
                <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage-dark">
                  +24%
                </span>
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-ink">3,910</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-muted">Try-ons</div>
              <div className="mt-3 space-y-2">
                {[
                  ["Goddess Braids", "82%"],
                  ["Ankara Two-piece", "51%"],
                ].map(([name, pct]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
                      <span>{name}</span>
                      <span>{pct}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-sage" style={{ width: pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="order-1 md:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
              For Boutiques &amp; Salons
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Turn browsers into buyers.
            </h2>
            <p className="mt-5 text-ink-muted">
              Give every customer a fitting room in their pocket. Showcase your
              catalog, cut return rates, and see exactly which styles convert —
              all from a dashboard that carries your brand.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Multi-branch catalogs with up to 10 categories",
                "Prepaid credits — 1 credit = 1 render",
                "Analytics: popular styles, conversion, engagement",
                "Excel exports & credit top-ups in a tap",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] text-paper">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sage">
            Simple, fair pricing
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
            Pay only for the looks you love.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Reveal>
            <div className="card flex h-full flex-col rounded-3xl p-8">
              <span className="text-sm text-ink-muted">Single</span>
              <div className="mt-3 font-display text-5xl font-semibold text-ink">KES 20</div>
              <p className="mt-2 text-sm text-ink-muted">1 AI try-on render</p>
              <div className="mt-6 flex-1" />
              <a href="#" className="rounded-full border border-ink/15 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50">
                Choose Single
              </a>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full flex-col rounded-3xl bg-sage p-8 text-paper shadow-xl shadow-sage/25">
              <span className="text-sm text-paper/80">Trio</span>
              <div className="mt-3 font-display text-5xl font-semibold">KES 50</div>
              <p className="mt-2 text-sm text-paper/80">3 AI try-on renders</p>
              <span className="mt-4 inline-block w-fit rounded-full bg-paper/20 px-3 py-1 text-xs font-semibold">
                Best value
              </span>
              <div className="mt-6 flex-1" />
              <a href="#" className="rounded-full bg-paper py-3 text-center text-sm font-semibold text-sage-dark transition hover:bg-white">
                Choose Trio
              </a>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="card flex h-full flex-col rounded-3xl p-8">
              <span className="text-sm text-ink-muted">Business</span>
              <div className="mt-3 font-display text-5xl font-semibold text-ink">Credits</div>
              <p className="mt-2 text-sm text-ink-muted">
                Prepaid packs for boutiques &amp; salons. 1 credit = 1 render.
              </p>
              <div className="mt-6 flex-1" />
              <a href="#business" className="rounded-full border border-ink/15 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white/50">
                Talk to us
              </a>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          Payments via M-Pesa. Final pricing configurable — shown for illustration.
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-20 text-center text-paper">
            <div className="aurora animate-aurora left-[8%] top-[-30%] h-[26vw] w-[26vw] bg-sage/40" />
            <div className="aurora animate-floatSlow right-[6%] bottom-[-30%] h-[22vw] w-[22vw] bg-[#e7d8c4]/30" />
            <h2 className="relative z-10 mx-auto max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
              Your next look is one tap away.
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-md text-paper/70">
              Join the try-before-you-buy revolution reshaping fashion and beauty
              across Africa.
            </p>
            <Link
              href="#how"
              className="relative z-10 mt-8 inline-block rounded-full bg-sage px-9 py-4 text-base font-semibold text-paper transition hover:bg-sage-dark"
            >
              Try On Instantly
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="border-t border-ink/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage">
                  <span className="h-2.5 w-2.5 rounded-full bg-paper" />
                </span>
                <span className="font-display text-xl font-semibold text-ink">ZDC</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-ink-muted">
                Wear the future. AI virtual try-on for apparel and hairstyles.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-muted">
              <a href="#" className="transition hover:text-ink">About</a>
              <a href="#" className="transition hover:text-ink">Privacy</a>
              <a href="#" className="transition hover:text-ink">Terms</a>
              <a href="#contact" className="transition hover:text-ink">Contact</a>
            </nav>
            <div className="flex gap-3">
              {["WA", "IG", "FB"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-xs font-semibold text-ink-muted transition hover:bg-sage hover:text-paper"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-10 border-t border-ink/10 pt-6 text-center text-xs text-ink-muted">
            © {new Date().getFullYear()} ZDC — Wear the Future. Now.
          </div>
        </div>
      </footer>
    </main>
  );
}
