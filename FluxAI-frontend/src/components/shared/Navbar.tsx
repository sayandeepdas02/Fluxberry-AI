"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setIsMobileMenuOpen(false);
        }
    };

    const navItems = [
        { label: "Features", href: "features" },
        { label: "Solutions", href: "solutions" },
        { label: "Pricing", href: "pricing" },
        { label: "Testimonials", href: "testimonials" },
    ];

    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300",
                isScrolled && "shadow-sm"
            )}
        >
            <div className="mx-auto md:max-w-5xl">
                <div className="screen-line-before screen-line-after border-x border-edge">
                    <div className="flex h-14 items-center justify-between px-4">
                        {/* Logo/Brand */}
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold">Fluxberry AI</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            {navItems.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => scrollToSection(item.href)}
                                    className="font-mono text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center space-x-3">
                            <Link href="/contact">
                                <Button variant="outline" size="sm">
                                    Book a Demo
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-edge bg-background">
                    <div className="mx-auto md:max-w-5xl px-4 py-4 space-y-3">
                        {navItems.map((item) => (
                            <button
                                key={item.href}
                                onClick={() => scrollToSection(item.href)}
                                className="block w-full text-left font-mono text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="flex flex-col space-y-2 pt-3">
                            <Link href="/contact" className="w-full">
                                <Button variant="outline" size="sm" className="w-full">
                                    Book a Demo
                                </Button>
                            </Link>
                            <Link href="/signup" className="w-full">
                                <Button size="sm" className="w-full">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
