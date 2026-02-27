"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navItems = [
        { name: 'Email Templates', href: '/dashboard/settings/email-templates' },
        { name: 'Onboarding Settings', href: '/dashboard/settings/onboarding' },
    ]

    return (
        <div className="flex h-full max-w-7xl mx-auto py-8 px-8 gap-8">
            <div className="w-64 shrink-0 space-y-1">
                <h2 className="text-xl font-semibold mb-6">Settings</h2>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                            pathname === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {item.name}
                    </Link>
                ))}
            </div>
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    )
}
