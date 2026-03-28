"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { GoogleLogin } from "@react-oauth/google";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
    const router = useRouter();
    const { signup, googleLogin } = useAuth();
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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError(null);
        if (credentialResponse.credential) {
            const result = await googleLogin(credentialResponse.credential);
            if (result.success && result.user) {
                if (result.user.onboardingCompleted) {
                    router.push("/dashboard");
                } else {
                    router.push("/onboard/step-1");
                }
            } else {
                setError(result.error || "Google signup failed");
                setIsLoading(false);
            }
        }
    };

    const handleGoogleError = () => {
        setError("Google signup was unsuccessful");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-background border border-line p-8 md:p-10 lg:p-12 w-full max-w-[520px] mx-auto"
        >
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                    Create your account
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Get started with Fluxberry AI in minutes.
                </p>
            </div>

            {/* Google Sign Up */}
            <div className="mb-6 flex justify-center w-full [&>div]:w-full [&_iframe]:!w-[100%] [&_iframe]:!min-w-full border border-line p-1">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border-t border-line"></div>
                <span className="text-xs text-muted-foreground font-medium uppercase font-mono tracking-widest">Or sign up with email</span>
                <div className="flex-1 border-t border-line"></div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Form Fields Grid */}
            <div className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>

                {/* Work Email focus state in design */}
                <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Password Setting */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Set Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="mobileNumber"
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Terms and Submit */}
            <div className="mt-6 mb-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    By submitting the form, you agree to receive communications
                    from us and to data processing in accordance with our{" "}
                    <Link
                        href="#"
                        className="text-foreground hover:text-primary hover:underline transition-colors"
                    >
                        Terms
                    </Link>{" "}
                    &{" "}
                    <Link
                        href="#"
                        className="text-foreground hover:text-primary hover:underline transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>

            <div className="pt-6 border-t border-line flex flex-col gap-4">
                <Button
                    type="submit"
                    className="w-full flex"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "Create Account"}
                </Button>
                
                <p className="text-sm text-center text-muted-foreground">
                    Have an account? <Link href="/signin" className="text-foreground hover:text-primary underline transition-colors">Sign in</Link>
                </p>
            </div>
        </form>
    );
}
