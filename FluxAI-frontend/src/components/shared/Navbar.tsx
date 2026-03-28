"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────
   NAV ITEMS
   ───────────────────────────────────────────────── */
const navItems = [
  { label: "Products", href: "/#products" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

/* ─────────────────────────────────────────────────
   NAVBAR COMPONENT
   Chanhdai-style: solid bg, screen-line-bottom, sharp
   ───────────────────────────────────────────────── */
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors",
        "duration-200 ease-out",
        "bg-background screen-line-bottom",
        isScrolled ? "border-b border-line" : ""
      )}
      style={{ height: "48px" }}
    >
      {/* Container: max-width 1200px, centered */}
      <div
        className="mx-auto flex h-full items-center justify-between"
        style={{
          maxWidth: "var(--container-max)",
          paddingInline: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* ── LEFT: Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-[8px] shrink-0 cursor-pointer"
          aria-label="Fluxberry AI Home"
        >
          <Image
            src="/favicon.png"
            alt="Fluxberry AI"
            width={32}
            height={32}
            className="h-[24px] w-[24px]"
            priority
          />
          <span
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: "var(--text-body-sm)" }}
          >
            FLUXBERRY AI
          </span>
        </Link>

        {/* ── CENTER: Navigation ── */}
        <nav className="hidden md:flex items-center gap-[24px]">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "font-medium text-muted-foreground cursor-pointer",
                "hover:text-foreground",
                "transition-colors duration-150 ease-out"
              )}
              style={{ fontSize: "var(--text-body-sm)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── RIGHT: CTAs ── */}
        <div className="hidden md:flex items-center gap-[12px]">
          {/* Secondary: Book a Demo */}
          <Link href="/demo">
            <button
              className={cn(
                "cursor-pointer font-medium",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors duration-200 ease-out"
              )}
              style={{
                padding: "6px 14px",
                fontSize: "var(--text-body-sm)",
              }}
            >
              Book a Demo
            </button>
          </Link>

          {/* Primary: Start free trial — sharp rectangular */}
          <Link href="/signup">
            <button
              className={cn(
                "cursor-pointer font-medium text-white",
                "hover:opacity-90",
                "transition-all duration-200 ease-out"
              )}
              style={{
                padding: "6px 16px",
                fontSize: "var(--text-body-sm)",
                backgroundColor: "#5561c8",
              }}
            >
              Start free trial
            </button>
          </Link>
        </div>

        {/* ── MOBILE: Hamburger ── */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={cn(
            "md:hidden flex items-center justify-center w-9 h-9 cursor-pointer",
            "border border-line bg-background",
            "hover:bg-muted transition-colors duration-200"
          )}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-4 h-4 text-foreground" />
          ) : (
            <Menu className="w-4 h-4 text-foreground" />
          )}
        </button>
      </div>

      {/* ── MOBILE MENU OVERLAY ── */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-40"
            style={{ top: "48px" }}
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Menu Panel — sharp, no rounded corners */}
          <div
            className={cn(
              "md:hidden fixed left-0 right-0 z-50",
              "bg-background",
              "border-b border-line",
              "p-5 space-y-1"
            )}
            style={{ top: "48px" }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "block py-3 px-4",
                  "font-medium text-muted-foreground",
                  "hover:text-foreground hover:bg-muted",
                  "transition-colors duration-150"
                )}
                style={{ fontSize: "var(--text-body)" }}
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-line space-y-2">
              <Link
                href="/demo"
                className="block"
                onClick={() => setIsMobileOpen(false)}
              >
                <button
                  className="w-full border border-border text-foreground font-medium cursor-pointer hover:bg-muted transition-colors duration-200"
                  style={{
                    height: "44px",
                    fontSize: "var(--text-body-sm)",
                  }}
                >
                  Book a Demo
                </button>
              </Link>
              <Link
                href="/signup"
                className="block"
                onClick={() => setIsMobileOpen(false)}
              >
                <button
                  className="w-full text-white font-medium cursor-pointer transition-colors duration-200"
                  style={{
                    height: "44px",
                    fontSize: "var(--text-body-sm)",
                    backgroundColor: "#5561c8",
                  }}
                >
                  Start free trial
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}