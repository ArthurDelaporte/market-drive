"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCookie } from "typescript-cookie";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import Header from "@/components/Header";
import { PRODUCTS_STATUS } from "@/config/constants";

export default function AdminOrderDetailsPage() {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const token = getCookie("access_token");
        if (token) setAccessToken(token);
    }, []);

    useEffect(() => {
        if (!accessToken || !orderId) return;

        const fetchOrder = async () => {
            try {
                // Récupérer les détails de la commande
                const orderResponse = await fetch(`/api/orders/${orderId}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!orderResponse.ok) throw new Error("Impossible de récupérer la commande");

                const data = await orderResponse.json();
                setOrder(data.order);

                // Récupérer les détails des produits
                fetchProducts(data.order.products);
            } catch (error) {
                setError(error instanceof Error ? error.message : "Erreur de récupération des données");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [accessToken, orderId]);

    const fetchProducts = async (cartProducts) => {
        if (!cartProducts.length) return;

        const productIds = [...new Set(cartProducts.map((p) => p.product_id))];

        try {
            const response = await fetch("/api/products/batch", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
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
                    <p><strong>Client :</strong> {order.users.firstname} {order.users.lastname}</p>
                    <p><strong>Email :</strong> {order.users.email}</p>
                    <p><strong>Payé le :</strong> {order.paid_at ? format(new Date(order.paid_at), "dd/MM/yyyy à HH'h'mm", { locale: fr }) : "Non payé"}</p>
                    <p><strong>Statut :</strong> {PRODUCTS_STATUS[order.status]}</p>
                    <p><strong>Montant total :</strong> {order.amount.toFixed(2).replace(".", ",")} €</p>

                    {order.appointments[0] ? (
                        <p>
                            <strong>Rendez-vous :</strong>
                            {format(new Date(order.appointments[0].date), "dd/MM/yyyy", { locale: fr })} à {order.appointments[0].time.replace(':', 'h')}
                        </p>
                    ) : (
                        <p><strong>Rendez-vous :</strong> Non planifié</p>
                    )}
                </div>

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
                                <td className="p-3 text-center">{product.total_price.toFixed(2).replace(".", ",")} €</td>
                                <td className="p-3 text-center">{p.quantity}</td>
                                <td className="p-3 text-right">{(product.total_price * p.quantity).toFixed(2).replace(".", ",")} €</td>
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
                    <Link href="/admin/commandes" className="text-blue-500 hover:underline">Retour aux commandes</Link>
                </div>
            </div>
        </div>
    );
}