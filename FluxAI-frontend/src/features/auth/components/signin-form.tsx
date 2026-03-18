"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export function SignInForm() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
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
        setIsLoading(true);
        setError(null);

        const result = await login(formData);

        if (result.success && result.user) {
            if (result.user.onboardingCompleted) {
                router.push("/dashboard");
            } else {
                router.push("/onboard/step-1");
            }
        } else {
            setError(result.error || "Invalid credentials");
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[20px] p-8 md:p-10 lg:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full"
        >
            <h2 className="font-sans text-[28px] md:text-[32px] font-semibold text-[#111] mb-8">
                Sign In
            </h2>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 rounded-[10px] bg-red-50 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Form Fields Grid */}
            <div className="space-y-5">
                {/* Email */}
                <div>
                    <label className="block font-sans text-[13px] font-medium text-[#333] mb-2">
                        Work Email address<span className="text-[#f64124]">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[10px] text-[14px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#f64124]/30 focus:border-[#f64124] transition-all"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Password Setting */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block font-sans text-[13px] font-medium text-[#333]">
                            Password<span className="text-[#f64124]">*</span>
                        </label>
                        <Link href="#" className="font-sans text-[12px] text-black/50 hover:text-[#f64124] hover:underline transition-colors shrink-0">
                            Forgot password?
                        </Link>
                    </div>
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
            </div>

            <div className="mt-8 flex items-center justify-between">
                <p className="text-sm font-sans text-black/50">
                    New here? <Link href="/signup" className="text-black hover:text-[#f64124] underline">Sign up</Link>
                </p>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#f64124] hover:bg-[#e53a1e] text-white font-mono text-[13px] font-medium tracking-[0.1em] uppercase py-3.5 px-8 rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </form>
    );
}
