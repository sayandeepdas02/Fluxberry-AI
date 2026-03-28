import { Geist, Geist_Mono } from "next/font/google";

export const fontSans = Geist({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    style: ["normal"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-geist",
});

export const fontHeading = Geist({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    style: ["normal"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-geist-display",
});

export const fontMono = Geist_Mono({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    style: ["normal"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-geist-mono",
});
