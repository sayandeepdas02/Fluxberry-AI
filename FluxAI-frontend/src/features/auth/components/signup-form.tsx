"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";

export function SignUpForm() {
    const router = useRouter();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        companyName: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation — run synchronously before setting loading state
        if (!formData.firstName.trim()) {
            setError("First name is required");
            return;
        }

        if (!formData.lastName.trim()) {
            setError("Last name is required");
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
            // Note: isLoading stays true intentionally here to prevent form
            // re-enabling during the navigation transition.
        } else {
            setError(result.error || "Signup failed");
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        // OAuth not implemented yet
        console.log("Google sign-in clicked");
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-sm text-muted-foreground">
                    Start hiring smarter with Fluxberry AI
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Google Sign In */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                className={cn(
                    "w-full flex items-center justify-center gap-3 px-4 py-2.5",
                    "border border-border rounded-md text-sm font-medium",
                    "hover:bg-muted transition-colors"
                )}
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Continue with Google
            </button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">
                        or continue with email
                    </span>
                </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors border-border hover:border-foreground/50"
                            )}
                            placeholder="John"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors border-border hover:border-foreground/50"
                            )}
                            placeholder="Doe"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Work Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Work Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={cn(
                            "w-full px-4 py-2.5 border rounded-md text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            "transition-colors border-border hover:border-foreground/50"
                        )}
                        placeholder="john@company.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Company Name */}
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                        Company Name
                    </label>
                    <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className={cn(
                            "w-full px-4 py-2.5 border rounded-md text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            "transition-colors border-border hover:border-foreground/50"
                        )}
                        placeholder="Acme Inc."
                        disabled={isLoading}
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={cn(
                            "w-full px-4 py-2.5 border rounded-md text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            "transition-colors border-border hover:border-foreground/50"
                        )}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium mb-2"
                    >
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={cn(
                            "w-full px-4 py-2.5 border rounded-md text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            "transition-colors border-border hover:border-foreground/50"
                        )}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-1"
                        required
                        disabled={isLoading}
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <Link href="#" className="text-foreground hover:underline">
                            Terms
                        </Link>{" "}
                        &{" "}
                        <Link href="#" className="text-foreground hover:underline">
                            Privacy Policy
                        </Link>
                    </label>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                </Button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link href="/signin" className="text-foreground font-medium hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
