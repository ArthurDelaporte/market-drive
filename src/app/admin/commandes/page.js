"use client";

import { useEffect, useState } from "react";
import { getCookie } from "typescript-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PRODUCTS_STATUS } from "@/config/constants";
import {FaInfoCircle} from 'react-icons/fa';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        const token = getCookie("access_token");
        if (token) setAccessToken(token);
    }, []);

    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) throw new Error("Impossible de récupérer les commandes");

                const data = await response.json();
                setOrders(data.orders);
                setHasCheckedAuth(true);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchOrders();
        }
    }, [accessToken, hasCheckedAuth]);

    if (!accessToken) return <p className="text-center p-4">Veuillez vous connecter.</p>;
    if (loading) return <p className="text-center p-4">Chargement...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <center>
                    <h1 className="text-2xl font-bold mb-6 md:mt-12 mt-40 pt-12">Toutes les Commandes</h1>
                </center>

                {orders.length === 0 ? (
                    <p className="text-gray-600">Aucune commande trouvée.</p>
                ) : (
                    <table className="w-full bg-white shadow-md rounded-lg">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="p-3 text-left">Prénom Nom</th>
                            <th className="p-3 text-left">Email</th>
                            <th className="p-3 text-left">Payé le</th>
                            <th className="p-3 text-center">Montant</th>
                            <th className="p-3 text-center">Statut</th>
                            <th className="p-3 text-center">Rendez-vous</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-t">
                                <td className="p-3 text-left">{order.users?.firstname} {order.users?.lastname}</td>
                                <td className="p-3 text-left">{order.users?.email}</td>
                                <td className="p-3 text-left">
                                    {order.paid_at
                                        ? new Date(order.paid_at).toLocaleDateString("fr-FR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        }) + " à " +
                                        new Date(order.paid_at).toLocaleTimeString("fr-FR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                        }).replace(":", "h")
                                        : "Non payé"}
                                </td>
                                <td className="p-3 text-center">{order.amount.toFixed(2)} €</td>
                                <td className="p-3 text-center">{PRODUCTS_STATUS[order.status]}</td>
                                <td className="p-3 text-center">
                                    {order.appointments[0] ? (
                                        `${format(new Date(order.appointments[0].date), "dd/MM/yyyy", { locale: fr })} à ${order.appointments[0].time.replace(':', 'h')}`
                                    ) : (
                                        <span>Non planifié</span>
                                    )}
                                </td>
                                <td className="p-3 flex justify-end">
                                    <Link href={`/admin/commandes/${order.id}`} className="text-blue-500 hover:underline">
                                        <FaInfoCircle className="h-5 w-5"/>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}