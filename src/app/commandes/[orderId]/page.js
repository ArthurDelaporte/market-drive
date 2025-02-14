"use client";

import { useEffect, useState } from "react";
import {useParams, useSearchParams} from "next/navigation";
import { getCookie } from "typescript-cookie";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import Header from "@/components/Header";
import {PRODUCTS_STATUS} from "@/config/constants";
import AppointmentForm from "@/components/AppointmentForm";

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const searchParams = useSearchParams();

    const appointment_form = searchParams.get('planifier') || false;

    const [user, setUser] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [products, setProducts] = useState([]);
    const [appointmentFormVisible, setAppointmentFormVisible] = useState(appointment_form);

    // Récupération du token au chargement
    useEffect(() => {
        const token = getCookie("access_token");
        if (token) setAccessToken(token);
    }, []);

    // Récupération des infos utilisateur et de la commande
    useEffect(() => {
        if (!accessToken || !orderId) return;

        const fetchUserAndOrder = async () => {
            try {
                // Récupérer l'utilisateur connecté
                const userResponse = await fetch("/api/auth/user", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!userResponse.ok) throw new Error("Impossible de récupérer l'utilisateur");

                const userData = await userResponse.json();
                setUser(userData);

                // Récupérer la commande
                const orderResponse = await fetch(`/api/user/${userData.id}/orders/${orderId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                if (!orderResponse.ok) throw new Error("Impossible de récupérer la commande");

                const data = await orderResponse.json();
                setOrder(data.order);

                if (data.order.appointments[0]) setAppointmentFormVisible(false);

                // Récupérer les produits détaillés
                fetchProducts(data.order.products);
            } catch (error) {
                setError(error instanceof Error ? error.message : "Erreur de récupération des données");
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndOrder();
    }, [accessToken, orderId]);

    const fetchProducts = async (cartProducts) => {
        if (!cartProducts.length) return;

        // Extraire les IDs uniques des produits
        const productIds = [...new Set(cartProducts.map((p) => p.product_id))];

        try {
            const response = await fetch("/api/products/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ productIds }),
            });

            if (!response.ok) throw new Error("Impossible de récupérer les produits");

            const data = await response.json();
            setProducts(data.products);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Erreur lors de la récupération des produits");
        }
    };

    if (!accessToken) return <p className="text-center p-4">Veuillez vous connecter.</p>;
    if (loading) return <p className="text-center p-4">Chargement...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;
    if (!order) return <p className="text-center p-4">Commande introuvable.</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <center>
                    <h1 className="text-2xl font-bold mb-6 md:mt-12 mt-24 pt-12">Détails de la commande</h1>
                </center>

                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    {/*<p><strong>ID de la commande :</strong> {order.id}</p>*/}
                    <p><strong>Payé le :</strong> {format(new Date(order.paid_at), "dd/MM/yyyy", { locale: fr })}</p>
                    <p><strong>Statut :</strong> {PRODUCTS_STATUS[order.status]}</p>
                    <p><strong>Montant total :</strong> {order.amount.toFixed(2).toString().replace('.',',')} €</p>

                    {order.appointments[0] ? (
                        <>
                            <p>
                                <strong>Mode :</strong> {order.appointments[0].is_retrait ? "Retrait en magasin" : "Livraison à domicile"}
                            </p>
                            <p>
                                <strong>Adresse :</strong> {order.appointments[0].address}
                            </p>
                            <p>
                                <strong>Rendez-vous :</strong>
                                {format(new Date(order.appointments[0].date), "dd/MM/yyyy", {locale: fr})} à {order.appointments[0].time.replace(':', 'h')}
                            </p>
                        </>
                    ) : (
                        <p>
                            <strong>Rendez-vous :</strong> Non planifié -
                            <button
                                onClick={() => setAppointmentFormVisible(prev => !prev)}
                                className="bg-transparent text-blue-500 hover:bg-transparent hover:text-blue-500 hover:underline shadow-none p-0 ml-1.5"
                            >
                                {appointmentFormVisible ? "Ne pas planifier" : "Planifier"}
                            </button>
                        </p>
                    )}
                </div>

                {appointmentFormVisible && (
                    <div className="flex flex-col items-center text-center p-10">
                        <AppointmentForm user_id={user.id} cart_id={order.id}/>
                    </div>
                )}

                <h2 className="text-xl font-semibold mb-4">Produits commandés</h2>
                <table className="w-full bg-white shadow-md rounded-lg">
                    <thead>
                    <tr className="bg-gray-200">
                        <th className="p-3 text-left">Produit</th>
                        <th className="p-3 text-center">Prix</th>
                        <th className="p-3 text-center">Quantité</th>
                        <th className="p-3 text-right">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {order.products.map((p) => {
                        const product = products.find(prod => prod.id === p.product_id);
                        return product ? (
                            <tr key={p.product_id} className="border-t">
                                <td className="p-3 text-left">{product.name}</td>
                                <td className="p-3 text-center">{product.total_price?.toString().replace('.', ',')} €</td>
                                <td className="p-3 text-center">{p.quantity}</td>
                                <td className="p-3 text-right">{(product.total_price * p.quantity).toFixed(2).toString().replace('.', ',')} €</td>
                            </tr>
                        ) : (
                            <tr key={p.product_id} className="border-t">
                                <td className="p-3 text-left">Produit inconnu</td>
                                <td className="p-3 text-center">0,00 €</td>
                                <td className="p-3 text-center">{p.quantity}</td>
                                <td className="p-3 text-right">0,00 €</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>

                <div className="mt-6">
                    <Link href="/commandes" className="text-blue-500 hover:underline">Retour aux commandes</Link>
                </div>
            </div>
        </div>
    );
}