import { GeistMono } from "geist/font";
import { IBM_Plex_Sans as FontSans } from "next/font/google";

export const fontSans = FontSans({
    weight: ["400", "500", "600"],
    display: "swap",
    subsets: ["latin"],
    variable: "--font-sans",
});

export const fontMono = GeistMono;
