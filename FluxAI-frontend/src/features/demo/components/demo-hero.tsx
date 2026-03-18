"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

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
   BENEFIT ITEM
   ═══════════════════════════════════════════════ */

function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-[28px] h-[28px] bg-[#f64124] rounded-[8px] shrink-0">
        <Check className="w-[14px] h-[14px] text-white stroke-[3]" />
      </span>
      <span className="text-[15px] font-sans text-white/90 leading-none">
        {children}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DEMO HERO SECTION
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
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
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
    <section className="w-full bg-[#FAFAFA] pt-6 md:pt-10 pb-0">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* ── HERO CARD ── */}
        <div className="relative w-full rounded-[28px] overflow-hidden min-h-[600px] lg:min-h-[640px]">

          {/* Background image */}
          <Image
            src="/demo-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
            quality={90}
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/20" />

          {/* ── CONTENT ── */}
          <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-12 p-8 md:p-12 lg:p-14">

            {/* ── LEFT: Copy ── */}
            <div className="flex flex-col justify-between flex-1 max-w-[520px] min-h-[460px] lg:min-h-[520px]">
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 bg-white/[0.12] backdrop-blur-md border border-white/[0.1] rounded-full px-4 py-2 mb-8">
                  <span className="w-[10px] h-[10px] bg-[#f64124] rounded-full shrink-0" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-white/90">
                    Book a Demo
                  </span>
                </div>

                {/* Heading */}
                <h1 className="font-sans text-[44px] md:text-[56px] lg:text-[68px] font-medium leading-[0.95] tracking-[-0.035em] text-white mb-6">
                  Request a<br />
                  demo for<br />
                  your team
                </h1>

                {/* Subtitle */}
                <p className="font-sans text-[15px] md:text-[16px] text-white/60 leading-[1.6] max-w-[380px]">
                  See how Fluxberry AI automates internal workflows and removes
                  the operational work that slows teams down.
                </p>
              </div>

              {/* ── Benefits 2×2 grid ── */}
              <div className="mt-10 lg:mt-0">
                <p className="font-sans text-[14px] text-white/50 mb-5">
                  What you&apos;ll get in the demo:
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <BenefitItem>Product walkthrough</BenefitItem>
                  <BenefitItem>Real examples</BenefitItem>
                  <BenefitItem>Questions answered</BenefitItem>
                  <BenefitItem>No obligations</BenefitItem>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Form Card ── */}
            <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0">
              {isSubmitted ? (
                /* ── SUCCESS STATE ── */
                <div className="bg-white rounded-[20px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-center">
                  <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF0EE]">
                    <Check className="w-8 h-8 text-[#f64124]" />
                  </div>
                  <h3 className="font-sans text-[22px] font-semibold text-[#111] mb-3">
                    Thank you!
                  </h3>
                  <p className="font-sans text-[15px] text-[#777] leading-[1.6] mb-6">
                    We&apos;ve received your request. Our team will reach out shortly
                    to schedule your personalized demo.
                  </p>
                  <Link href="/">
                    <button className="bg-[#f64124] hover:bg-[#e53a1e] text-white font-mono text-[11px] font-medium tracking-[0.1em] uppercase px-8 py-3.5 rounded-full transition-colors duration-200 cursor-pointer">
                      Back to Home
                    </button>
                  </Link>
                </div>
              ) : (
                /* ── FORM ── */
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-[20px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
                >
                  <h2 className="font-sans text-[20px] md:text-[22px] font-semibold text-[#111] mb-8">
                    Sign up now to see Fluxberry AI in action
                  </h2>

                  {/* First + Last name row */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block font-sans text-[13px] font-medium text-[#333] mb-2"
                      >
                        First name<span className="text-[#f64124]">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all ${
                          errors.firstName
                            ? "border-[#f64124]"
                            : "border-transparent"
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-[11px] text-[#f64124] mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block font-sans text-[13px] font-medium text-[#333] mb-2"
                      >
                        Last name<span className="text-[#f64124]">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all ${
                          errors.lastName
                            ? "border-[#f64124]"
                            : "border-transparent"
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-[11px] text-[#f64124] mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-5">
                    <label
                      htmlFor="email"
                      className="block font-sans text-[13px] font-medium text-[#333] mb-2"
                    >
                      Email address<span className="text-[#f64124]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all ${
                        errors.email
                          ? "border-[#f64124]"
                          : "border-transparent"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-[#f64124] mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className="block font-sans text-[13px] font-medium text-[#333] mb-2"
                    >
                      Your message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#F5F5F5] border border-transparent rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all resize-vertical"
                    />
                  </div>

                  {/* Terms */}
                  <p className="font-sans text-[12px] text-[#999] leading-[1.6] mb-6">
                    By submitting the form, you agree to receive communications
                    from us and to data processing in accordance with our{" "}
                    <Link
                      href="#"
                      className="text-[#f64124] hover:underline font-medium"
                    >
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link
                      href="#"
                      className="text-[#f64124] hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#f64124] hover:bg-[#e53a1e] text-white font-mono text-[12px] font-medium tracking-[0.1em] uppercase px-8 py-3.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.02]"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
