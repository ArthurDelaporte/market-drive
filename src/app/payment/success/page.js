"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import AppointmentForm from "@/components/AppointmentForm";

// Composant intermédiaire
function SearchParamsHandler({ setUserId, setCartId }) {
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const cartId = searchParams.get("cartId");

    useEffect(() => {
        setUserId(userId || '');
        setCartId(cartId || '');
    }, [userId, cartId, setUserId, setCartId]);

    return null;
}

export default function SuccessPage() {
    const [userId, setUserId] = useState('');
    const [cartId, setCartId] = useState('');

    return (
        <>
            <Header/>
            <Suspense fallback={<p>Chargement des paramètres...</p>}>
                <SearchParamsHandler setUserId={setUserId} setCartId={setCartId} />
            </Suspense>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <div className="text-center p-10">
                    <h1 className="text-3xl font-bold text-green-600">Paiement réussi ! 🎉</h1>
                    <p>Merci pour votre achat.</p>
                </div>
                <div className="text-center p-10">
                    <AppointmentForm user_id={userId} cart_id={cartId} />
                </div>
            </div>
        </>
    );
}
