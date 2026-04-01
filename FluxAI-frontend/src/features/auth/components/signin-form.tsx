"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { GoogleLogin } from "@react-oauth/google";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignInForm() {
    const router = useRouter();
    const { login, googleLogin } = useAuth();
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
                setError(result.error || "Google login failed");
                setIsLoading(false);
            }
        }
    };

    const handleGoogleError = () => {
        setError("Google login was unsuccessful");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-background border border-line p-8 md:p-10 lg:p-12 w-full max-w-[440px] mx-auto"
        >
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                    Welcome back
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Enter your credentials to access your account.
                </p>
            </div>

            {/* Google Sign In */}
            <div className="mb-6 flex justify-center w-full [&>div]:w-full [&_iframe]:!w-[100%] [&_iframe]:!min-w-full border border-line p-1">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border-t border-line"></div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Or continue with</span>
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
                {/* Email */}
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
                        placeholder="name@company.com"
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline">
                            Forgot password?
                        </Link>
                    </div>
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
            </div>

            <div className="mt-8 pt-6 border-t border-line flex flex-col gap-4">
                <Button
                    type="submit"
                    className="w-full flex"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                
                <p className="text-sm text-center text-muted-foreground">
                    Don't have an account? <Link href="/signup" className="text-foreground hover:text-primary underline transition-colors">Sign up</Link>
                </p>
            </div>
        </form>
    );
}
