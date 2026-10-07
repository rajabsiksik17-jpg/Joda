import { Cairo, Cormorant_Garamond, Inter, Tajawal } from "next/font/google";

/** Identity fonts: Cairo Bold (Arabic headings), Tajawal Regular (Arabic body), Cormorant Garamond (English display). */
export const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["600", "700"], variable: "--font-cairo", display: "swap" });
export const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-tajawal", display: "swap" });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" });
/** UI/body companion for English text. */
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const fontVariables = `${cairo.variable} ${tajawal.variable} ${cormorant.variable} ${inter.variable}`;
