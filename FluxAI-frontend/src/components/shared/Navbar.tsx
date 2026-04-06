"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHINE_CLASSES } from "@/components/shared/layout-primitives";

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
        "sticky top-0 z-50 w-full transition-colors",
        "duration-200 ease-out",
        "bg-background border-b border-line"
      )}
      style={{ height: "64px" }}
    >
      {/* Container fits to parent main naturally since it's sticky and w-full */}
      <div
        className="flex h-full items-center justify-between"
        style={{
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
            width={56}
            height={56}
            className="h-[40px] w-[40px]"
            priority
          />
          <span
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: "20px" }}
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
              style={{ fontSize: "var(--text-body)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── RIGHT: Minimal Auth / Action ── */}
        <div className="hidden md:flex items-center gap-[16px]">
          <Link href="/demo">
            <button
              className={cn(
                "cursor-pointer font-medium text-white",
                "border border-black bg-black",
                "hover:bg-black/90 active:scale-[0.98]",
                "transition-all duration-200 ease-out rounded-none",
                SHINE_CLASSES
              )}
              style={{
                padding: "4px 12px",
                fontSize: "var(--text-body)",
              }}
            >
              Book a Demo
            </button>
          </Link>
          <Link href="/signup">
            <button
              className={cn(
                "cursor-pointer font-medium text-white",
                "border border-[#5561c8] bg-[#5561c8]",
                "hover:opacity-90 active:scale-[0.98]",
                "transition-all duration-200 ease-out rounded-none",
                SHINE_CLASSES
              )}
              style={{
                padding: "4px 12px",
                fontSize: "var(--text-body)",
              }}
            >
              Get Started
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
            style={{ top: "80px" }}
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Menu Panel — sharp, no rounded corners */}
          <div
            className={cn(
              "md:hidden fixed left-0 right-0 z-50",
              "bg-background",
              "border-b border-line",
              "p-5 space-y-1 mx-auto max-w-[var(--container-max)] border-x"
            )}
            style={{ top: "80px" }}
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
                  className={cn(
                    "w-full text-white font-medium cursor-pointer hover:bg-black/90 transition-colors duration-200 rounded-none bg-black",
                    SHINE_CLASSES
                  )}
                  style={{
                    height: "40px",
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
                  className={cn(
                    "w-full text-white font-medium cursor-pointer hover:opacity-90 transition-opacity duration-200 rounded-none",
                    SHINE_CLASSES
                  )}
                  style={{
                    backgroundColor: "#5561c8",
                    height: "40px",
                    fontSize: "var(--text-body-sm)",
                  }}
                >
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}