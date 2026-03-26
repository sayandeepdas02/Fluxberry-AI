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
    <div>
      <h4 className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/30 mb-4">
        {heading}
      </h4>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[15px] text-white/65 hover:text-white transition-colors"
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
  const companyLinks = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/#products" },
    { label: "Solutions", href: "/#features" },
    { label: "Contact", href: "/demo" },
  ];

  const resourceLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "Testimonials", href: "/#testimonials" },
    { label: "Blogs", href: "#" },
    { label: "FAQ", href: "/#faq" },
  ];

  const connectLinks = [
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "X", href: "#" },
  ];

  return (
    <div className="w-full bg-[#FAFAFA] px-6 lg:px-8 pb-12">
      <footer className="max-w-[1200px] mx-auto bg-[#0E0E0E] text-white rounded-[24px] overflow-hidden">

        {/* ── TOP SECTION: Logo + Link Columns ── */}
        <div className="px-8 md:px-10 lg:px-10 pt-10 pb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            {/* Logo */}
            <div className="shrink-0">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src="/fluxberry-logo-white.png"
                  alt="Fluxberry AI"
                  width={140}
                  height={28}
                  className="h-[150px] w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Link Columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-8">
              <FooterColumn heading="Company" links={companyLinks} />
              <FooterColumn heading="Resources" links={resourceLinks} />
              <FooterColumn heading="Connect" links={connectLinks} />
            </div>
          </div>
        </div>

        {/* ── NEWSLETTER ── */}
        <div className="px-8 md:px-10 lg:px-10 pb-8">
          <div className="max-w-[420px]">
            <h3 className="font-mono text-[14px] tracking-[0.12em] uppercase text-white/90 mb-2">
              Stay in the loop.
            </h3>
            <p className="text-[13px] text-white/40 leading-[20px] mb-5">
              Get product updates, new features, and practical insights about
              hiring — delivered occasionally, never spam.
            </p>

            {/* Input */}
            <div className="flex items-center bg-white rounded-full p-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-transparent text-black text-[14px] outline-none placeholder:text-[#999] min-w-0"
              />
              <button className="bg-[#f64124] hover:bg-[#e2361a] text-white text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-full uppercase transition-colors shrink-0 cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="px-8 md:px-10 lg:px-10 border-t border-white/[0.06] py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <span className="text-[10px] text-white/30 tracking-[0.12em] uppercase">
            © 2026 Fluxberry AI. All rights reserved.
          </span>

          <div className="flex gap-6">
            <Link href="#" className="text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-[10px] text-white/30 tracking-[0.12em] uppercase hover:text-white/50 transition-colors">
              Cookies Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}