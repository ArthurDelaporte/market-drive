import type { Metadata } from "next";
import localFont from "next/font/local";
import './globals.css';
import { CartProvider } from "@/context/CartContext"; // Import du CartProvider

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
    title: "Drive Courses - Faites vos courses en ligne",
    description: "Commandez vos courses en ligne et récupérez-les à votre drive. Livraison rapide et facile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {/* Réintégration du CartProvider */}
                <CartProvider>
                    {children}
                </CartProvider>
                <footer className="footer">
                    <p>Made with 🤬 by 🦧</p>
                </footer>
            </body>
        </html>
    );
}
