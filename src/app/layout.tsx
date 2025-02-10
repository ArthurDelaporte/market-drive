import type { Metadata } from "next";
import localFont from "next/font/local";
import './globals.css';
import Link from 'next/link';

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
                <link rel="icon" href="/favicon.ico"/>
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
                <main className="flex-grow mb-16">
                    {children}
                </main>
                <footer className="bg-gray-1000 text-white py-4">
   <div className="container mx-auto px-4 text-center">
       <Link href="/contact" className="hover:text-blue-400 text-base">Nous Contacter</Link>
   </div>
</footer>
            </body>
        </html>
    );
}