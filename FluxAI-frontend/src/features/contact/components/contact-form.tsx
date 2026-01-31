"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FormData {
    name: string;
    email: string;
    contactNumber: string;
    companyName: string;
    companySize: string;
    location: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    contactNumber?: string;
    companyName?: string;
    companySize?: string;
    location?: string;
}

const companySizeOptions = [
    { value: "", label: "Select company size" },
    { value: "1-10", label: "1–10" },
    { value: "11-50", label: "11–50" },
    { value: "51-200", label: "51–200" },
    { value: "201-500", label: "201–500" },
    { value: "500+", label: "500+" },
];

export function ContactForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        contactNumber: "",
        companyName: "",
        companySize: "",
        location: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});

    // Email validation
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Form validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = "Contact number is required";
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = "Company name is required";
        }

        if (!formData.companySize) {
            newErrors.companySize = "Company size is required";
        }

        if (!formData.location.trim()) {
            newErrors.location = "Location is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            // UI-only: Just show success state
            setIsSubmitted(true);
        }
    };

    // Handle input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-16">
                <div className="mb-6 inline-flex items-center justify-center size-20 rounded-full bg-muted">
                    <Check className="size-10 text-foreground" />
                </div>

                <h2 className="text-3xl font-semibold mb-4">
                    Thanks for reaching out!
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    Our team will contact you soon to discuss how FluxAI can transform
                    your hiring process.
                </p>

                <Button onClick={() => (window.location.href = "/")}>
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-3">Book a Demo</h1>
                <p className="text-lg text-muted-foreground">
                    Let's discuss how FluxAI can transform your hiring process.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors",
                                errors.name
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                            placeholder="John Doe"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
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
                                "transition-colors",
                                errors.email
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                            placeholder="john@company.com"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Number */}
                    <div>
                        <label
                            htmlFor="contactNumber"
                            className="block text-sm font-medium mb-2"
                        >
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            id="contactNumber"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors",
                                errors.contactNumber
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                            placeholder="+1 (555) 123-4567"
                        />
                        {errors.contactNumber && (
                            <p className="text-xs text-red-500 mt-1.5">
                                {errors.contactNumber}
                            </p>
                        )}
                    </div>

                    {/* Company Name */}
                    <div>
                        <label
                            htmlFor="companyName"
                            className="block text-sm font-medium mb-2"
                        >
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
                                "transition-colors",
                                errors.companyName
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                            placeholder="Acme Corp"
                        />
                        {errors.companyName && (
                            <p className="text-xs text-red-500 mt-1.5">
                                {errors.companyName}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Company Size */}
                    <div>
                        <label
                            htmlFor="companySize"
                            className="block text-sm font-medium mb-2"
                        >
                            Company Size
                        </label>
                        <select
                            id="companySize"
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors bg-background",
                                errors.companySize
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                        >
                            {companySizeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.companySize && (
                            <p className="text-xs text-red-500 mt-1.5">
                                {errors.companySize}
                            </p>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label
                            htmlFor="location"
                            className="block text-sm font-medium mb-2"
                        >
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors",
                                errors.location
                                    ? "border-red-500"
                                    : "border-border hover:border-foreground/50"
                            )}
                            placeholder="San Francisco, CA"
                        />
                        {errors.location && (
                            <p className="text-xs text-red-500 mt-1.5">{errors.location}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <Button type="submit" size="lg">
                        Submit Request
                    </Button>
                    <button
                        type="button"
                        onClick={() => (window.location.href = "/")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
