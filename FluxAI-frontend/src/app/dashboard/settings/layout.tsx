"use client"
import React from 'react'

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="px-10 py-8 h-full">
            {children}
        </div>
    )
}
