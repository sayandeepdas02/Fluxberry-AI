"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export function SignUpForm() {
    const router = useRouter();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobileNumber: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.firstName.trim()) {
            setError("First name is required");
            return;
        }
        if (!formData.lastName.trim()) {
            setError("Last name is required");
            return;
        }
        if (!formData.email.trim()) {
            setError("Work email is required");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await signup({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email,
            password: formData.password,
            organizationName: formData.companyName || `${formData.firstName}'s Organization`,
        });

        if (result.success) {
            router.push("/onboard/step-1");
        } else {
            setError(result.error || "Signup failed");
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[20px] p-8 md:p-10 lg:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full"
        >
            <h2 className="font-sans text-[28px] md:text-[32px] font-semibold text-[#111] mb-8">
                Create your Account
            </h2>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 rounded-[10px] bg-red-50 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Form Fields Grid */}
            <div className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                            First name<span className="text-[#f64124]">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                            Last name<span className="text-[#f64124]">*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Company Name */}
                <div>
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Company Name
                    </label>
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                        disabled={isLoading}
                    />
                </div>

                {/* Work Email focus state in design */}
                <div className="relative">
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Work Email address<span className="text-[#f64124]">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        // Added specific focused styling match for the input in visual reference
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all relative z-10"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Password Setting */}
                <div>
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Set your Password<span className="text-[#f64124]">*</span>
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Confirm Password<span className="text-[#f64124]">*</span>
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Mobile Number */}
                <div>
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Terms and Submit */}
            <div className="mt-8 mb-8">
                <p className="font-sans text-[12px] text-[#777] leading-[1.6]">
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
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm font-sans text-black/50">
                    Have an account? <Link href="/signin" className="text-black hover:text-[#f64124] underline">Sign in</Link>
                </p>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#f64124] hover:bg-[#e53a1e] text-white font-mono text-[13px] font-medium tracking-[0.1em] uppercase py-3.5 px-8 rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Creating..." : "Create Account"}
                </button>
            </div>
        </form>
    );
}
