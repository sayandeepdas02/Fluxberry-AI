"use client"

import { useEffect, useState } from "react"

interface AnimatedCounterProps {
    value: number
    duration?: number // in ms, default 1000
    className?: string
}

export function AnimatedCounter({ value, duration = 1000, className }: AnimatedCounterProps) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTimestamp: number | null = null
        const startValue = count

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)

            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4)

            setCount(Math.floor(startValue + (value - startValue) * easeProgress))

            if (progress < 1) {
                window.requestAnimationFrame(step)
            } else {
                setCount(value)
            }
        }

        window.requestAnimationFrame(step)
    }, [value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

    return <span className={className}>{count}</span>
}
