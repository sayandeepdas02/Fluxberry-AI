import { GeistMono } from "geist/font";
import { Arimo } from "next/font/google";

export const fontSans = Arimo({
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-ibm-plex-sans",
});

export const fontMono = GeistMono;
