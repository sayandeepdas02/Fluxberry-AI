"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";

export function Footer() {
  return (
    <footer
      id="footer"
      className="w-full relative border-t border-white/5 bg-[#0A0A0F] overflow-hidden pt-16 lg:pt-24 px-6 sm:px-8 pb-0 text-white"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-8 md:gap-12 relative z-10">

        <div className="lg:col-span-3 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <Image
              src="/favicon.png"
              alt="Fluxberry AI"
              width={48}
              height={48}
              className="object-contain"
              style={{ width: "48px", height: "48px" }}
              priority
            />
            <span className="font-semibold text-white tracking-tight text-2xl">
              FLUXBERRY AI
            </span>
          </Link>
          <p className="text-sm/6 text-neutral-400 max-w-96 font-normal">
            The intelligent hiring operating system for modern, fast-moving teams. Transform your hiring process with AI-driven insights and automation.
          </p>
          <div className="flex gap-4 md:gap-5 order-1 md:order-2 pt-2">
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

        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16 items-start">
          {/* Product */}
          <div>
            <h3 className="font-semibold text-white tracking-wider text-xs uppercase mb-4 opacity-80">Product</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><FooterLink href="#agents">AI Agents</FooterLink></li>
              <li><FooterLink href="#product-tour">Workflows</FooterLink></li>
              <li><FooterLink href="/pricing">Pricing</FooterLink></li>
              <li><FooterLink href="#metrics">Impact</FooterLink></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white tracking-wider text-xs uppercase mb-4 opacity-80">Company</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><FooterLink href="/about">About Us</FooterLink></li>
              <li className="flex items-center gap-2">
                <FooterLink href="/careers">Careers</FooterLink>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5561c8]/20 border border-[#5561c8]/50 text-white font-medium">HIRING</span>
              </li>
              <li><FooterLink href="/blog">Blog</FooterLink></li>
              <li><FooterLink href="/contact">Contact</FooterLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold text-white tracking-wider text-xs uppercase mb-4 opacity-80">Legal</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
              <li><FooterLink href="/terms">Terms of Service</FooterLink></li>
              <li><FooterLink href="/security">Security (SOC2)</FooterLink></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <p className="text-neutral-500 text-sm">© {new Date().getFullYear()} Fluxberry AI.</p>
        <p className="text-sm text-neutral-500">All rights reserved.</p>
      </div>

      <div className="relative mt-12 select-none w-full flex items-center justify-center overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-5xl h-48 bg-gradient-to-r from-[#5561c8]/20 via-indigo-500/20 to-purple-500/20 blur-[160px] pointer-events-none" />
        
        {/* Fade overlay mimicking bakedwith effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0A0A0F]/70 to-transparent z-10 pointer-events-none" />

        <TextHoverEffect text="FLUXBERRY AI" />
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors duration-200 ease-out hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-[#5561c8]/50"
      )}
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
        "flex items-center justify-center transition-colors duration-200 ease-out rounded-full",
        "focus:outline-none focus:ring-2 focus:ring-[#5561c8]/50",
        "bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10",
        "w-10 h-10"
      )}
    >
      {children}
    </a>
  );
}