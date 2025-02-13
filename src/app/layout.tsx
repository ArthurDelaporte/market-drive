import type { Metadata } from "next";
import localFont from "next/font/local";
import './globals.css';
import Link from 'next/link';
import {ToastContainer} from "react-toastify";

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

const title = "Drive Courses - Faites vos courses en ligne"
const description = "Commandez vos courses en ligne et récupérez-les à votre drive. Livraison rapide et facile."

export const metadata: Metadata = {
  title: title,
  description: description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

    return (
        <html lang="fr">
            <head>
                <title>{title}</title>
                <meta name="description" content={description}/>
                <link rel="icon" href="/favicon.ico"/>
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
                <ToastContainer position="top-right" autoClose={3000} pauseOnHover closeOnClick />
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
