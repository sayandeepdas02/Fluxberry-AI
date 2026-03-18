import Link from "next/link";
import Image from "next/image";

/* ═══════════════════════════════════════════════
   FOOTER LINK COLUMN
   ═══════════════════════════════════════════════ */

interface FooterLink {
  label: string;
  href: string;
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div className="flex flex-col">
      <h4 className="font-mono text-[10px] text-white/30 tracking-[0.14em] uppercase mb-5">
        {heading}
      </h4>
      <ul className="flex flex-col gap-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="font-sans text-[16px] leading-[22px] text-white/65 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════ */

export function Footer() {
  const companyLinks: FooterLink[] = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/#products" },
    { label: "Solutions", href: "/#features" },
    { label: "Contact", href: "/contact" },
  ];

  const resourceLinks: FooterLink[] = [
    { label: "Pricing", href: "/pricing" },
    { label: "Testimonials", href: "/#testimonials" },
    { label: "Blogs", href: "#" },
    { label: "FAQ", href: "/#faq" },
  ];

  const connectLinks: FooterLink[] = [
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "X", href: "#" },
  ];

  return (
    <div className="w-full bg-[#FAFAFA] pb-10 px-6 lg:px-8">
      <footer className="max-w-[1280px] mx-auto bg-[#111111] text-white rounded-[28px] overflow-hidden">
        {/* ── TOP SECTION ── */}
        <div className="px-8 md:px-12 lg:px-14 pt-14 pb-14">
          <div className="flex flex-col lg:flex-row justify-between gap-14 lg:gap-8">
            {/* Logo */}
            <div className="shrink-0">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src="/fluxberry-logo-white.png"
                  alt="Fluxberry AI"
                  width={180}
                  height={32}
                  className="h-[180px] w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Link Columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 lg:gap-16">
              <FooterColumn heading="Company" links={companyLinks} />
              <FooterColumn heading="Resources" links={resourceLinks} />
              <FooterColumn heading="Connect" links={connectLinks} />
            </div>
          </div>
        </div>

        {/* ── NEWSLETTER SECTION ── */}
        <div className="px-8 md:px-12 lg:px-14 pb-14">
          <div className="max-w-[520px]">
            <h3 className="font-mono text-[16px] font-medium tracking-[0.12em] uppercase mb-3 text-white/90">
              Stay in the loop.
            </h3>
            <p className="font-mono text-[14px] leading-[20px] font-normal text-white/40 mb-6">
              Get product updates, new features, and practical insights about
              hiring — delivered occasionally, never spam.
            </p>

            {/* Email Input */}
            <div className="flex items-center bg-white rounded-full p-1.5 max-w-[460px] focus-within:ring-2 focus-within:ring-white/10 transition-all">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent px-5 py-2 outline-none text-black font-sans text-[15px] placeholder:text-[#999] min-w-0"
              />
              <button className="bg-[#f64124] hover:bg-[#e2361a] text-white font-mono text-[12px] font-medium tracking-[0.12em] px-7 py-3 rounded-full transition-colors uppercase shrink-0 cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM LEGAL BAR ── */}
        <div className="mx-8 md:mx-12 lg:mx-14 border-t border-white/[0.08] py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <span className="font-mono text-[10px] text-white/30 tracking-[0.12em] uppercase">
            © 2026 Fluxberry AI. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-6 md:gap-8">
            <Link
              href="#"
              className="font-mono text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="font-mono text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="font-mono text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors"
            >
              Cookies Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
