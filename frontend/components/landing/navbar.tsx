"use client"

import { Github } from "lucide-react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b" : "bg-transparent"}`}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">I</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-primary">Interview AI</span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {["Features", "Pricing", "Testimonials"].map((item) => (
                        <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center space-x-4">
                    <Link href="https://github.com/sayandeepdas02" target="_blank" className="text-slate-600 hover:text-primary transition-colors">
                        <Github className="h-5 w-5" />
                    </Link>
                    <Link href="/dashboard">
                        <Button>Get Started</Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
