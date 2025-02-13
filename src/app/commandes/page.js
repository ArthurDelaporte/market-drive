"use client";

import { useEffect, useState } from "react";
import { getCookie } from "typescript-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {format} from "date-fns";
import { fr } from "date-fns/locale";
import { PRODUCTS_STATUS } from "@/config/constants";

export default function OrdersPage() {
    const [setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [accessToken, setAccessToken] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        const token = getCookie("access_token");
        if (token) setAccessToken(token);
    }, []);

    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchUser = async () => {
            try {
                const response = await fetch("/api/auth/user", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) throw new Error("Impossible de récupérer l'utilisateur");

                const userData = await response.json();

                if (userData.role === "admin") {
                    router.push("/admin/commandes");
                }

                setUser(userData);
                setHasCheckedAuth(true);

                fetchOrders(userData.id);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchUser();
        }
    }, [accessToken, hasCheckedAuth, router, fetchOrders]);

    const fetchOrders = async (userId) => {
        try {
            const response = await fetch(`/api/user/${userId}/orders`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            if (!response.ok) throw new Error("Impossible de récupérer les commandes");

            const data = await response.json();
            setOrders(data.orders);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!accessToken) return <p className="text-center p-4">Veuillez vous connecter.</p>;

    if (loading) return <p className="text-center p-4">Chargement...</p>;

    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <center>
                    <h1 className="text-2xl font-bold mb-6 md:mt-12 mt-40 pt-12">Mes Commandes</h1>
                </center>

                {orders.length === 0 ? (
                    <p className="text-gray-600">Aucune commande passée.</p>
                ) : (
                    <table className="w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200">
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
                                <td className="p-3 text-left">{order.paid_at
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
                                    : "Non payé"}</td>
                                <td className="p-3 text-center">{order.amount.toFixed(2)} €</td>
                                <td className="p-3 text-center">{PRODUCTS_STATUS[order.status]}</td>
                                <td className="p-3 text-center">{order.appointments[0] ?
                                    (
                                        `${format(new Date(order.appointments[0].date), "dd/MM/yyyy", { locale: fr })} à ${order.appointments[0].time.replace(':', 'h')}`
                                    ) : (
                                        <span>
                                            Non planifié -{" "}
                                            <Link
                                                href={`/commandes/${order.id}?planifier=true`}
                                                className="text-blue-500 hover:underline"
                                            >
                                                Planifier
                                              </Link>
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    <Link href={`/commandes/${order.id}`} className="text-blue-500 hover:underline">
                                        Voir détails
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