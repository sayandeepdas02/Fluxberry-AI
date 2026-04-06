"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHINE_CLASSES } from "@/components/shared/layout-primitives";

/* ═══════════════════════════════════════════════
   FORM DATA TYPES
   ═══════════════════════════════════════════════ */

interface DemoFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

interface DemoFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/* ═══════════════════════════════════════════════
   BENEFIT ITEM — Sharp minimal
   ═══════════════════════════════════════════════ */

function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center shrink-0 w-5 h-5 border border-line bg-muted/50 rounded-sm">
        <Check className="w-3.5 h-3.5 text-foreground" />
      </div>
      <span className="text-[14px] text-muted-foreground font-medium">
        {children}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEMO HERO SECTION — Chanhdai Editorial Minimal
   ═══════════════════════════════════════════════ */

export function DemoHero() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<DemoFormData>({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<DemoFormErrors>({});

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: DemoFormErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Required";
    if (!formData.lastName.trim()) newErrors.lastName = "Required";
    if (!formData.email.trim()) {
      newErrors.email = "Required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitted(true);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof DemoFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section className="relative w-full bg-background screen-line-bottom">
      <div
        className="mx-auto flex flex-col md:flex-row w-full max-w-[1200px] border-x border-line relative z-10"
      >
        {/* ── LEFT: Typography & Copy ── */}
        <div 
          className="flex-1 border-r border-line"
          style={{ padding: "clamp(64px, 8vw, var(--space-20)) clamp(24px, 4vw, var(--space-12))" }}
        >
          <div className="max-w-[480px]">
             {/* Badge */}
             <div className="inline-flex items-center gap-2 border border-line bg-muted/20 px-3 py-1 mb-8 rounded-none">
              <span className="w-1.5 h-1.5 bg-brand rounded-full shrink-0" />
               <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                 Book a Demo
               </span>
             </div>

             {/* Heading */}
             <h1 
               className="tracking-tight text-foreground text-balance"
               style={{
                 fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                 lineHeight: "1.05",
                 letterSpacing: "-0.03em",
               }}
             >
               See Fluxberry AI in action.
             </h1>

             {/* Subtitle */}
             <p className="text-[16px] text-muted-foreground leading-[1.6] max-w-[380px] mt-6">
               Discover how we automate your internal workflows and completely remove the operational overhead that slows teams down.
             </p>

             {/* ── Benefits grid ── */}
             <div className="mt-12 pt-12 border-t border-line">
               <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-6">
                 What to expect
               </span>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                 <BenefitItem>Product walkthrough</BenefitItem>
                 <BenefitItem>Real examples</BenefitItem>
                 <BenefitItem>Questions answered</BenefitItem>
                 <BenefitItem>No obligations</BenefitItem>
               </div>
             </div>
          </div>
        </div>

        {/* ── RIGHT: Form Container ── */}
        <div 
          className="w-full md:w-[500px] shrink-0 bg-muted/10 relative"
          style={{ padding: "clamp(64px, 8vw, var(--space-20)) clamp(24px, 4vw, var(--space-12))" }}
        >
           {/* Subtle background hatched pattern block overlay */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-line opacity-20 pointer-events-none" style={{ maskImage: "radial-gradient(circle, black, transparent)" }}></div>

           {isSubmitted ? (
             /* ── SUCCESS STATE ── */
             <div className="bg-background border border-line p-10 h-full flex flex-col justify-center items-center text-center">
               <div className="mb-6 flex items-center justify-center w-12 h-12 border border-line bg-muted/30">
                 <Check className="w-6 h-6 text-brand" />
               </div>
               <h3 className="text-xl font-semibold mb-3 tracking-tight">
                 Request Received
               </h3>
               <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[280px]">
                 Our team will reach out shortly to schedule your personalized demo session.
               </p>
               <Link href="/">
                 <button className="bg-foreground text-background text-[13px] font-medium px-6 py-2 transition-colors hover:bg-foreground/90 active:scale-[0.98]">
                   Return Home
                 </button>
               </Link>
             </div>
           ) : (
             /* ── FORM ── */
             <form
               onSubmit={handleSubmit}
               className="bg-background border border-line p-8 lg:p-10"
             >
               <h2 className="text-xl font-semibold mb-8 tracking-tight">
                 Schedule your session
               </h2>

               {/* First + Last name row */}
               <div className="grid grid-cols-2 gap-4 mb-5">
                 <div>
                   <label htmlFor="firstName" className="block text-[13px] font-medium text-foreground mb-2">
                     First name
                   </label>
                   <input
                     type="text"
                     id="firstName"
                     name="firstName"
                     value={formData.firstName}
                     onChange={handleChange}
                     className={cn(
                       "w-full bg-transparent border px-3 py-2 text-[14px] transition-colors rounded-none",
                       "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
                       errors.firstName ? "border-destructive focus:ring-destructive" : "border-line"
                     )}
                   />
                 </div>
                 <div>
                   <label htmlFor="lastName" className="block text-[13px] font-medium text-foreground mb-2">
                     Last name
                   </label>
                   <input
                     type="text"
                     id="lastName"
                     name="lastName"
                     value={formData.lastName}
                     onChange={handleChange}
                     className={cn(
                       "w-full bg-transparent border px-3 py-2 text-[14px] transition-colors rounded-none",
                       "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
                       errors.lastName ? "border-destructive focus:ring-destructive" : "border-line"
                     )}
                   />
                 </div>
               </div>

               {/* Email */}
               <div className="mb-5">
                 <label htmlFor="email" className="block text-[13px] font-medium text-foreground mb-2">
                   Work email
                 </label>
                 <input
                   type="email"
                   id="email"
                   name="email"
                   value={formData.email}
                   onChange={handleChange}
                   className={cn(
                     "w-full bg-transparent border px-3 py-2 text-[14px] transition-colors rounded-none",
                     "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
                     errors.email ? "border-destructive focus:ring-destructive" : "border-line"
                   )}
                 />
               </div>

               {/* Message */}
               <div className="mb-8">
                 <label htmlFor="message" className="block text-[13px] font-medium text-foreground mb-2">
                   Message (Optional)
                 </label>
                 <textarea
                   id="message"
                   name="message"
                   value={formData.message}
                   onChange={handleChange}
                   rows={3}
                   className="w-full bg-transparent border border-line px-3 py-2 text-[14px] transition-colors focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand resize-vertical rounded-none"
                 />
               </div>

               {/* Submit */}
               <button
                 type="submit"
                 className={cn(
                   "w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-white text-[13px] font-medium px-4 py-2.5 transition-colors cursor-pointer active:scale-[0.98] rounded-none"
                 )}
               >
                 Request Demo
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>

               {/* Terms */}
               <p className="text-[12px] text-muted-foreground leading-relaxed mt-6">
                 By submitting, you agree to our{" "}
                 <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</Link>{" "}
                 and{" "}
                 <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>.
               </p>

             </form>
           )}
        </div>
      </div>
    </section>
  );
}
