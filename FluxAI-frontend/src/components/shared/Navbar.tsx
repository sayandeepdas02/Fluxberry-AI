"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = ["Products", "Pricing", "Testimonials"];

  return (
    <header className="sticky top-6 z-50 flex justify-center w-full">
      <div className="w-full max-w-[1200px] px-4 flex items-center justify-between">
        
        {/* LEFT CAPSULE */}
        <div className="hidden md:flex items-center h-[52px] bg-[#F2F2F2] rounded-full px-7 border border-black/5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center font-mono text-[16px] leading-[16px] font-medium tracking-[0.05em] text-black mr-6"
          >
            <svg width="15" height="15" viewBox="5 5 22 22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="mr-[10px]">
              <path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" />
            </svg>
            FLUXBERRY AI<sup className="text-[10px] -mt-3 ml-[2px]">®</sup>
          </Link>

          {/* DASHED DIVIDER */}
          <div className="h-5 w-[1px] border-l border-dashed border-gray-400" />

          {/* NAV LINKS */}
          <nav className="flex flex-1 justify-center items-center space-x-9 ml-9">
            {navItems.map((item) => (
              <Link
                key={item}
                href={`/#${item.toLowerCase()}`}
                className="font-sans text-[12px] font-normal uppercase tracking-[0.05em] text-black hover:opacity-70 transition"
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT CAPSULE */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#F2F2F2] rounded-full p-[4px] border border-black/5 h-[52px] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          {/* SIGN IN */}
          <Link href="/login" className="h-full">
            <button className="flex items-center justify-center h-full font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em] text-black border border-black rounded-full px-6 hover:bg-black/5 transition">
              SIGN IN <span className="ml-[6px] text-[14px] font-sans">↗</span>
            </button>
          </Link>

          {/* CTA */}
          <Link href="/contact" className="h-full">
            <button className="flex items-center justify-center h-full rounded-full bg-[#f64124] text-white font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em] px-6 hover:bg-[#e2361a] transition border border-transparent shadow-sm">
              BOOK A DEMO <span className="ml-[6px] text-[14px] font-sans">↗</span>
            </button>
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <div className="md:hidden flex items-center justify-between w-full bg-[#F2F2F2] rounded-full px-5 h-[52px] border border-black/5">
           <Link
            href="/"
            className="flex items-center font-mono text-[16px] leading-[16px] font-medium tracking-wide text-black"
          >
            <svg width="14" height="14" viewBox="5 5 22 22" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" />
            </svg>
            FLUXBERRY AI<sup className="text-[9px] -mt-2 ml-[1px]">®</sup>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="absolute top-[70px] left-4 right-4 md:hidden rounded-2xl border border-black/10 bg-white p-4 space-y-4 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="block font-sans text-[12px] font-normal uppercase tracking-[0.05em] text-black/80"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="pt-2 space-y-2">
            <Link href="/login" className="block w-full">
              <button className="w-full rounded-full border border-black py-3 font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em]">
                SIGN IN <span className="ml-[2px] text-[14px] font-sans">↗</span>
              </button>
            </Link>
            <Link href="/contact" className="block w-full">
              <button className="w-full h-full rounded-full bg-[#f64124] text-white py-3 font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em]">
                BOOK A DEMO <span className="ml-[2px] text-[14px] font-sans">↗</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}