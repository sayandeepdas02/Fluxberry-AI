"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Scan,
  TrendingUp,
  Presentation,
  GitBranch,
  UserCheck,
  AlertCircle,
  Settings,
  Headphones,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

interface ProductMetric {
  icon: LucideIcon;
  text: string;
}

interface ProductItem {
  id: string;
  title: string;
  description: string;
  imagePosition: "left" | "right";
  metrics: ProductMetric[];
}

const products: ProductItem[] = [
  {
    id: "sourcing",
    title: "Talent Sourcing",
    description:
      "Dashboards reveal trends, driving smarter HR decisions from workforce data.",
    imagePosition: "right",
    metrics: [
      { icon: Scan, text: "Real-time metrics" },
      { icon: TrendingUp, text: "Retention trends" },
      { icon: Presentation, text: "Custom dashboards" },
    ],
  },
  {
    id: "ats",
    title: "Job Board & ATS",
    description:
      "Manage policies, compliance, acknowledgments—all in one place, staying ahead.",
    imagePosition: "left",
    metrics: [
      { icon: GitBranch, text: "Policy hub" },
      { icon: UserCheck, text: "Staff acknowledgment" },
      { icon: AlertCircle, text: "Compliance alerts" },
    ],
  },
  {
    id: "assessment",
    title: "Interview Assesement",
    description:
      "Dashboards reveal trends, driving smarter HR decisions from workforce data.",
    imagePosition: "right",
    metrics: [
      { icon: Scan, text: "Real-time metrics" },
      { icon: TrendingUp, text: "Retention trends" },
      { icon: Presentation, text: "Custom dashboards" },
    ],
  },
  {
    id: "onboarding",
    title: "Talent Onboarding",
    description:
      "Manage policies, compliance, acknowledgments—all in one place, staying ahead.",
    imagePosition: "left",
    metrics: [
      { icon: GitBranch, text: "Policy hub" },
      { icon: UserCheck, text: "Staff acknowledgment" },
      { icon: AlertCircle, text: "Compliance alerts" },
    ],
  },
];

/* Card dimensions for the scroll system */
const CARD_HEIGHT = 480;        // px — min-height of each card
const CARD_OVERLAP = 60;        // px — how much each card overlaps the previous
const STACK_OFFSET_TOP = 100;   // px — initial sticky top offset

/* ═══════════════════════════════════════════════
   PRODUCTS SECTION
   ═══════════════════════════════════════════════ */

export function Products() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className="w-full bg-[#FAFAFA]" id="products">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* ── SECTION HEADER ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pt-24 mb-16">
          {/* Left — Heading */}
          <h2 className="text-[42px] md:text-[54px] lg:text-[60px] font-sans font-medium leading-[1.05] tracking-[-0.03em]">
            <span className="text-[#111]">All in one Hiring</span>
            <br />
            <span className="text-[#111]">Platform </span>
            <span className="text-[#B0B0B0]">to hire</span>
            <br />
            <span className="text-[#B0B0B0]">the best talent</span>
          </h2>

          {/* Right — Badge + Description */}
          <div className="flex flex-col items-start lg:pt-2">
            <div className="inline-flex items-center gap-2 bg-[#F0F0F0] px-3 py-1.5 rounded-full mb-5 border border-black/[0.04]">
              <div className="w-2 h-2 rounded-full bg-[#f64124]" />
              <span className="text-[10px] font-mono tracking-[0.1em] font-semibold text-black/50 uppercase">
                Products
              </span>
            </div>
            <p className="text-[15px] text-[#444] leading-[1.6] mb-3 max-w-[400px]">
              Fluxberry AI is designed as a hiring operating system — not just
              another ATS.
            </p>
            <p className="text-[15px] text-[#888] leading-[1.6] max-w-[400px]">
              It connects sourcing, screening, evaluation, and onboarding into
              one continuous pipeline powered by AI.
            </p>
          </div>
        </div>

        {/* ── SCROLL STACK CONTAINER ──
            Height = enough scroll room for all cards to stack.
            Each card is sticky so it pins to the viewport while
            the container scrolls behind it. */}
        <div
          ref={sectionRef}
          className="relative"
          style={{
            height: `${products.length * (CARD_HEIGHT + CARD_OVERLAP)}px`,
          }}
        >
          {products.map((product, index) => (
            <StickyCard
              key={product.id}
              product={product}
              index={index}
              total={products.length}
              sectionRef={sectionRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   STICKY CARD
   Each card is position: sticky. As the user scrolls,
   cards naturally stack on top of each other.
   Framer Motion adds scale + opacity micro-animations
   so previous cards recede subtly.
   ═══════════════════════════════════════════════ */

function StickyCard({
  product,
  index,
  total,
  sectionRef,
}: {
  product: ProductItem;
  index: number;
  total: number;
  sectionRef: React.RefObject<HTMLDivElement | null>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  /* Track each card's scroll progress within the section.
     - start: when the card's top enters the viewport
     - end:   when the card has been scrolled past */
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  /* As the card scrolls out (progress 0.5 → 1), it
     scales down and fades — creating the "pushed back" effect */
  const isLast = index === total - 1;
  const scale = useTransform(
    scrollYProgress,
    [0.4, 0.75],
    [1, isLast ? 1 : 0.95]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0.4, 0.8],
    [1, isLast ? 1 : 0.7]
  );

  const isImageLeft = product.imagePosition === "left";

  return (
    <div
      ref={cardRef}
      className="sticky w-full"
      style={{
        /* Each card sticks a little lower than the previous,
           creating the progressive overlap effect */
        top: `${STACK_OFFSET_TOP + index * 20}px`,
        zIndex: 10 + index,
        marginBottom: index < total - 1 ? `-${CARD_OVERLAP}px` : "0",
      }}
    >
      <motion.div
        style={{ scale, opacity }}
        className="w-full rounded-[20px] border border-black/[0.06] bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] origin-top will-change-transform"
      >
        <div
          className={`flex flex-col ${
            isImageLeft ? "md:flex-row" : "md:flex-row-reverse"
          } min-h-[480px]`}
        >
          {/* ── IMAGE PANE ── */}
          <div className="w-full md:w-[50%] bg-[#f64124] relative overflow-hidden min-h-[300px] md:min-h-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f64124] via-[#e8503a] to-[#d13a1f]" />
            <div
              className={`absolute ${
                isImageLeft
                  ? "top-8 left-8 right-[-20px] bottom-[-20px]"
                  : "top-8 right-8 left-[-20px] bottom-[-20px]"
              }`}
            >
              <MockDashboard />
            </div>
          </div>

          {/* ── TEXT PANE ── */}
          <div className="w-full md:w-[50%] p-8 md:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <h3 className="text-[22px] md:text-[24px] font-semibold text-[#111] tracking-tight mb-3 leading-tight">
                {product.title}
              </h3>
              <p className="text-[15px] text-[#666] leading-[1.65] max-w-[380px]">
                {product.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-12 md:mt-0">
              {product.metrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div key={i} className="flex items-center gap-3.5">
                    <Icon
                      className="w-[20px] h-[20px] text-[#f64124]"
                      strokeWidth={1.5}
                    />
                    <span className="text-[15px] text-[#555] font-medium">
                      {metric.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MOCK DASHBOARD
   Pixel-accurate reproduction of the Fluxberry
   AI "Teams" interface shown in the Figma design.
   ═══════════════════════════════════════════════ */

function MockDashboard() {
  const sidebarNav = [
    { label: "Fluxberry AI", icon: "grid", active: false },
    { label: "Teams", icon: "users", active: true },
    { label: "Calendar", icon: "calendar", active: false },
    { label: "Time Off", icon: "clock", active: false },
    { label: "Projects", icon: "folder", active: false },
    { label: "Teams", icon: "users2", active: false },
    { label: "Integrations", icon: "puzzle", active: false },
    { label: "Benefits", icon: "gift", active: false },
    { label: "Documents", icon: "file", active: false },
  ];

  const favs = [
    { name: "Loom Mobile App", shortcut: "⌘ 31" },
    { name: "Monday Redesign", shortcut: "⌘ 29" },
    { name: "Udemy Courses", shortcut: "⌘ 6" },
  ];

  const users = [
    { name: "James Brown", email: "james@alignful.com", title: "Marketing", since: "Since Aug.", color: "bg-[#F97316]" },
    { name: "Sophia Williams", email: "sophia@alignful.com", title: "HR Assist", since: "Since Aug.", color: "bg-[#FBBF24]" },
    { name: "Arthur Taylor", email: "arthur@alignful.com", title: "Enterprise", since: "Since Aug.", color: "bg-[#3B82F6]" },
    { name: "Emma Wright", email: "emma@alignful.com", title: "Front-end", since: "Since Aug.", color: "bg-[#EC4899]" },
    { name: "Matthew Johnson", email: "matthew@alignful.com", title: "Product D", since: "Since Aug.", color: "bg-[#8B5CF6]" },
    { name: "Laura Perez", email: "laura@alignful.com", title: "Customer", since: "Since Aug.", color: "bg-[#F43F5E]" },
    { name: "Wei Chen", email: "wei@alignful.com", title: "Data Ana", since: "Since Aug.", color: "bg-[#14B8A6]" },
  ];

  return (
    <div className="w-full h-full bg-[#FEFCFC] rounded-tl-[14px] shadow-2xl flex overflow-hidden border border-black/[0.04]">
      {/* ── SIDEBAR ── */}
      <div className="w-[185px] shrink-0 bg-[#FDF8F7] border-r border-[#F5E8E5] p-4 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7 px-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#f64124] to-[#ff7b5c] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="3" cy="3" r="1.5" fill="white" />
              <circle cx="7" cy="3" r="1.5" fill="white" />
              <circle cx="3" cy="7" r="1.5" fill="white" />
              <circle cx="7" cy="7" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-[13px] text-[#222]">
            Fluxberry AI
          </span>
        </div>

        {/* MAIN section */}
        <div className="text-[9px] font-bold text-[#B0A8A6] tracking-[0.12em] uppercase mb-2.5 px-1">
          Main
        </div>
        <div className="space-y-0.5 mb-6">
          {sidebarNav.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-[6px] rounded-lg text-[12px] relative ${
                item.active
                  ? "bg-[#FCEAE6] text-[#f64124] font-medium"
                  : "text-[#888] hover:text-[#555]"
              }`}
            >
              {item.active && (
                <div className="absolute -left-4 top-0 bottom-0 w-[3px] bg-[#f64124] rounded-r-full" />
              )}
              <SidebarIcon type={item.icon} active={item.active} />
              {item.label}
            </div>
          ))}
        </div>

        {/* FAVS section */}
        <div className="text-[9px] font-bold text-[#B0A8A6] tracking-[0.12em] uppercase mb-2.5 px-1">
          Favs
        </div>
        <div className="space-y-0.5 mb-6">
          {favs.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-[5px] text-[11px] text-[#777]"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f64124]" />
                {item.name}
              </div>
              <span className="text-[9px] text-[#bbb] font-mono">
                {item.shortcut}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom links */}
        <div className="mt-auto space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-[6px] text-[12px] text-[#888]">
            <Settings className="w-3 h-3" />
            Settings
          </div>
          <div className="flex items-center gap-2.5 px-3 py-[6px] text-[12px] text-[#888]">
            <Headphones className="w-3 h-3" />
            Support
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <h3 className="text-[18px] font-semibold text-[#111] mb-0.5">
            Teams
          </h3>
          <p className="text-[11px] text-[#999] mb-4">
            Manage and collaborate within your organization&apos;s te...
          </p>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[#F0F0F0]">
            <div className="px-4 pb-2.5 text-[12px] font-medium text-[#f64124] border-b-2 border-[#f64124]">
              All
            </div>
            <div className="px-4 pb-2.5 text-[12px] font-medium text-[#BBB]">
              Absent
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-4 pt-3 overflow-hidden flex-1">
          {/* Column headers */}
          <div className="flex items-center px-3 py-2 mb-1">
            <div className="w-4 h-4 rounded border border-[#DDD] mr-3 shrink-0" />
            <div className="flex-1 text-[10px] text-[#AAA] font-medium uppercase tracking-wider">
              Name ⇅
            </div>
            <div className="w-[90px] text-[10px] text-[#AAA] font-medium uppercase tracking-wider text-right">
              Title ⇅
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-[2px]">
            {users.map((user, i) => (
              <div
                key={i}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  i === 0
                    ? "bg-[#FEF2F0] border border-[#FCDEDA]"
                    : "hover:bg-[#FAFAFA]"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded border mr-3 shrink-0 ${
                    i === 0 ? "border-[#f64124]" : "border-[#DDD]"
                  }`}
                />
                <div
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold mr-3 shrink-0 ${user.color}`}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-[12px] font-medium text-[#222] truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[#999] truncate">
                    {user.email}
                  </div>
                </div>
                <div className="w-[90px] shrink-0 text-right">
                  <div className="text-[11px] text-[#444] truncate">
                    {user.title}
                  </div>
                  <div className="text-[9px] text-[#BBB]">{user.since}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR ICON
   ═══════════════════════════════════════════════ */

function SidebarIcon({
  type,
  active,
}: {
  type: string;
  active: boolean;
}) {
  const color = active ? "#f64124" : "#999";
  const size = 13;

  switch (type) {
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M11 14v-1a3 3 0 00-3-3H5a3 3 0 00-3 3v1" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="6.5" cy="5" r="2.5" stroke={color} strokeWidth="1.3" />
          <path d="M14 14v-1a3 3 0 00-2-2.8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="10.5" cy="5" r="2" stroke={color} strokeWidth="1.3" />
        </svg>
      );
    default:
      return (
        <div
          className="rounded-full border-[1.5px]"
          style={{
            width: size,
            height: size,
            borderColor: color,
          }}
        />
      );
  }
}
