"use client";

import {useRouter} from "next/navigation";
import Header from "@/components/Header";

export default function CancelPage() {
    const router = useRouter();
    return (
        <>
            <Header/>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <div className="text-center p-10">
                    <h1 className="text-3xl font-bold text-red-600">Paiement annulé ! ❌</h1>
                    <p>Vous pouvez réessayer.</p>
                </div>
                <div className="text-center p-10 pt-0">
                    <button onClick={() => router.push('/panier')}>Retourner au panier</button>
                </div>
            </div>
        </>
)
    ;
}