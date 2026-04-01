"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────
   FOOTER — Chanhdai-style Editorial
   Flat dark, sharp edges, border-line dividers
   ───────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer
      id="footer"
      className="w-full relative overflow-hidden screen-line-top"
      style={{
        backgroundColor: "#0f172a",
      }}
    >
      <div
        className="mx-auto flex flex-col w-full px-6 sm:px-8 max-w-[1200px] border-x border-white/10"
        style={{
          paddingTop: "clamp(64px, 8vw, var(--space-20))",
          paddingBottom: "var(--space-8)",
        }}
      >
        {/* ═══ TOP GRIDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* ── LEFT: Brand & Description ── */}
          <div className="md:col-span-5 flex flex-col items-start text-left">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image
                src="/favicon.png"
                alt="Fluxberry AI"
                width={32}
                height={32}
                className="object-contain"
                style={{ width: "24px", height: "24px" }}
                priority
              />
              <span className="font-semibold text-white tracking-tight text-lg">
                Fluxberry AI
              </span>
            </Link>
            
            <p
              className="font-normal max-w-[320px]"
              style={{
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: "var(--text-body-sm)",
                lineHeight: "1.6",
              }}
            >
              The intelligent hiring operating system for modern, fast-moving teams.
            </p>
          </div>

          {/* ── RIGHT: Links ── */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-white/80 text-xs uppercase tracking-wider">Product</h4>
              <ul className="flex flex-col gap-3">
                <li><FooterLink href="#agents">AI Agents</FooterLink></li>
                <li><FooterLink href="#product-tour">Workflows</FooterLink></li>
                <li><FooterLink href="/pricing">Pricing</FooterLink></li>
                <li><FooterLink href="#metrics">Impact</FooterLink></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-white/80 text-xs uppercase tracking-wider">Company</h4>
              <ul className="flex flex-col gap-3">
                <li><FooterLink href="/about">About Us</FooterLink></li>
                <li><FooterLink href="/careers">Careers</FooterLink></li>
                <li><FooterLink href="/blog">Blog</FooterLink></li>
                <li><FooterLink href="/contact">Contact</FooterLink></li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-white/80 text-xs uppercase tracking-wider">Legal</h4>
              <ul className="flex flex-col gap-3">
                <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
                <li><FooterLink href="/terms">Terms of Service</FooterLink></li>
                <li><FooterLink href="/security">Security (SOC2)</FooterLink></li>
              </ul>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM BAR ═══ */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p
            className="text-center md:text-left"
            style={{
              color: "rgba(255, 255, 255, 0.35)",
              fontSize: "var(--text-micro)",
            }}
          >
            © {new Date().getFullYear()} Fluxberry AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-3">
            <SocialLink href="https://twitter.com" ariaLabel="Twitter">
              <Twitter className="w-4 h-4" />
            </SocialLink>
            <SocialLink href="https://linkedin.com" ariaLabel="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </SocialLink>
            <SocialLink href="https://github.com" ariaLabel="GitHub">
              <Github className="w-4 h-4" />
            </SocialLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────── */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors duration-200 ease-out ",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
      style={{
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "var(--text-body-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
      }}
    >
      {children}
    </Link>
  );
}

function SocialLink({ href, ariaLabel, children }: { href: string; ariaLabel: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center transition-colors duration-200 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
      style={{
        width: "36px",
        height: "36px",
        color: "rgba(255, 255, 255, 0.35)",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(255, 255, 255, 0.35)";
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
      }}
    >
      {children}
    </a>
  );
}