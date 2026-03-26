"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Products", href: "/#products" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Testimonials", href: "/#testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-4 pb-3">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 flex items-center justify-between">

        {/* ── LEFT PILL ── */}
        <div className="hidden md:flex items-center h-[52px] bg-[#F0F0F0] rounded-full pl-5 pr-6 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 mr-5">
            <Image
              src="/fluxberry-logo.png"
              alt="Fluxberry AI"
              width={160}
              height={28}
              className="h-[150px] w-auto"
              priority
            />
          </Link>

          {/* Divider */}
          <div className="w-px h-[22px] bg-black/10 mr-5" />

          {/* Nav Links */}
          <nav className="flex items-center gap-7">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-black/70 hover:text-black transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── RIGHT PILL ── */}
        <div className="hidden md:flex items-center gap-[6px] h-[52px] bg-[#F0F0F0] rounded-full p-[5px] border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

          {/* Sign In */}
          <Link href="/login">
            <button className="h-[42px] px-5 rounded-full bg-white border border-black/[0.08] font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-black/80 flex items-center gap-1.5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              Sign In
              <span className="text-[13px] leading-none">↗</span>
            </button>
          </Link>

          {/* Book a Demo */}
          <Link href="/demo">
            <button className="h-[42px] px-6 rounded-full bg-[#f64124] font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-white flex items-center gap-1.5 hover:bg-[#e53a1e] transition-colors duration-200 cursor-pointer shadow-sm">
              Book a Demo
              <span className="text-[13px] leading-none">↗</span>
            </button>
          </Link>
        </div>

        {/* ── MOBILE ── */}
        <div className="md:hidden flex items-center justify-between w-full">
          <Link href="/" className="flex items-center">
            <Image
              src="/fluxberry-logo.png"
              alt="Fluxberry AI"
              width={140}
              height={24}
              className="h-[20px] w-auto"
              priority
            />
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F0F0F0] border border-black/[0.04]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {isOpen && (
        <div className="md:hidden absolute top-[72px] left-4 right-4 bg-white rounded-2xl border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-5 space-y-1 z-50">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block py-3 px-4 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-black/70 hover:text-black hover:bg-black/[0.02] rounded-xl transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-black/[0.06] space-y-2">
            <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
              <button className="w-full h-[44px] rounded-full border border-black/10 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-black/80 hover:bg-black/[0.02] transition-colors cursor-pointer">
                Sign In ↗
              </button>
            </Link>
            <Link href="/demo" className="block" onClick={() => setIsOpen(false)}>
              <button className="w-full h-[44px] rounded-full bg-[#f64124] text-white font-mono text-[12px] font-medium uppercase tracking-[0.08em] hover:bg-[#e53a1e] transition-colors cursor-pointer">
                Book a Demo ↗
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}