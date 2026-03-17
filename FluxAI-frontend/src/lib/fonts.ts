import { Inter, IBM_Plex_Mono } from "next/font/google";

export const fontSans = Inter({
    weight: ["400", "500", "600", "700"],
    style: ["normal"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-inter",
});

export const fontHeading = Inter({
    weight: ["400", "500", "600", "700"],
    style: ["normal"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-inter-display",
});

export const fontMono = IBM_Plex_Mono({
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-ibm-plex-mono",
});
