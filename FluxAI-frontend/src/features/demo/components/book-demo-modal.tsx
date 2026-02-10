"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

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

export function BookDemoModal({ isOpen, onClose }: BookDemoModalProps) {
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

    const modalRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({
                    name: "",
                    email: "",
                    contactNumber: "",
                    companyName: "",
                    companySize: "",
                    location: "",
                });
                setErrors({});
            }, 200); // Wait for close animation
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen && !isSubmitted && firstInputRef.current) {
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, isSubmitted]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

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

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                "bg-black/40 backdrop-blur-sm",
                "animate-in fade-in duration-200"
            )}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >

                <div
                    ref={modalRef   }
                    className={cn(
                        "relative w-full max-w-md bg-background rounded-lg shadow-lg border border-edge",
                        "animate-in zoom-in-95 duration-200"
                    )}
                    onClick={(e) => e.stopPropagation()}
>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Close modal"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="p-6">
                    {!isSubmitted ? (
                        /* Form State */
                        <>
                           <h2
  id="modal-title"
  className="text-xl font-semibold mb-1"
>
  Book a Demo
</h2>

                            <p className="text-sm text-muted-foreground mb-4">
                                Let's discuss how Fluxberry AI can transform your hiring process.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Name */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium mb-1"
                                    >
                                        Name
                                    </label>
                                    <input
                                        ref={firstInputRef}
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-md text-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            "transition-colors",
                                            errors.name
                                                ? "border-red-500"
                                                : "border-border hover:border-foreground/50"
                                        )}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium mb-1.5"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-md text-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            "transition-colors",
                                            errors.email
                                                ? "border-red-500"
                                                : "border-border hover:border-foreground/50"
                                        )}
                                        placeholder="john@company.com"
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Contact Number */}
                                <div>
                                    <label
                                        htmlFor="contactNumber"
                                        className="block text-sm font-medium mb-1.5"
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
                                            "w-full px-3 py-2 border rounded-md text-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            "transition-colors",
                                            errors.contactNumber
                                                ? "border-red-500"
                                                : "border-border hover:border-foreground/50"
                                        )}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    {errors.contactNumber && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.contactNumber}
                                        </p>
                                    )}
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label
                                        htmlFor="companyName"
                                        className="block text-sm font-medium mb-1.5"
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
                                            "w-full px-3 py-2 border rounded-md text-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            "transition-colors",
                                            errors.companyName
                                                ? "border-red-500"
                                                : "border-border hover:border-foreground/50"
                                        )}
                                        placeholder="Acme Corp"
                                    />
                                    {errors.companyName && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.companyName}
                                        </p>
                                    )}
                                </div>

                                {/* Company Size */}
                                <div>
                                    <label
                                        htmlFor="companySize"
                                        className="block text-sm font-medium mb-1.5"
                                    >
                                        Company Size
                                    </label>
                                    <select
                                        id="companySize"
                                        name="companySize"
                                        value={formData.companySize}
                                        onChange={handleChange}
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-md text-sm",
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
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.companySize}
                                        </p>
                                    )}
                                </div>

                                {/* Location */}
                                <div>
                                    <label
                                        htmlFor="location"
                                        className="block text-sm font-medium mb-1.5"
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
                                            "w-full px-3 py-2 border rounded-md text-sm",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            "transition-colors",
                                            errors.location
                                                ? "border-red-500"
                                                : "border-border hover:border-foreground/50"
                                        )}
                                        placeholder="San Francisco, CA"
                                    />
                                    {errors.location && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
    type="button"
    onClick={onClose}
    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    Cancel
  </button>
  <Button type="submit">
    Submit
  </Button>
</div>

                           
                           
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="mb-4 inline-flex items-center justify-center size-16 rounded-full bg-muted">
                                <svg
                                    className="size-8 text-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-semibold mb-3">
                                Thanks for reaching out!
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                Our team will contact you soon.
                            </p>

                            <Button onClick={onClose} className="w-full">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}








