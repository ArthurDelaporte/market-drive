"use client";

import { useEffect, useState } from "react";
import { getCookie } from "typescript-cookie";
import Link from "next/link";
import Header from "@/components/Header";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PRODUCTS_STATUS, STATUS_FLOW } from "@/config/constants";
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

    /**
     * 📌 Fonction pour mettre à jour le statut d'une commande
     */
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ newStatus }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || "Erreur lors de la mise à jour du statut.");
            }

            // Mettre à jour localement les commandes après modification
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (error) {
            setError(error.message);
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
                            <th className="p-3 text-center">Mode</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => {
                            let allowedStatuses = STATUS_FLOW[order.status] || [];
                            if (order.status === 'prepared' && order.appointments[0]) {
                                if (order.appointments[0].is_retrait) {
                                    allowedStatuses = ["recovery"]
                                } else {
                                    allowedStatuses = ["delivery"]
                                }
                            }
                            return (<tr key={order.id} className="border-t">
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
                                <td className="p-3 text-center">
                                    {/* 📌 Sélecteur pour changer le statut */}
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="border p-2 rounded"
                                    >
                                        <option value={order.status}>
                                            {PRODUCTS_STATUS[order.status]}
                                        </option>
                                        {allowedStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {PRODUCTS_STATUS[status]}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                {order.appointments[0] ? (
                                    <>
                                        <td className="p-3 text-center">
                                            {format(new Date(order.appointments[0].date), "dd/MM/yyyy", {locale: fr})} à {" "}
                                            {order.appointments[0].time.replace(':', 'h')}
                                        </td>
                                        <td className="p-3 text-center">
                                            {order.appointments[0].is_retrait ?
                                                <span>Retrait en magasin</span>
                                                : (
                                                    <Link href={`/admin/commandes/${order.id}`}
                                                          className="text-blue-500 hover:underline">
                                                        <p>Voir l&#39;adresse de livraison</p>
                                                    </Link>
                                                )}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3 text-center">
                                            <span>Non planifié</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span>Non planifié</span>
                                        </td>
                                    </>
                                )}
                                <td className="p-3 flex justify-end items-center h-full">
                                    <Link href={`/admin/commandes/${order.id}`}
                                          className="text-blue-500 hover:underline">
                                        <FaInfoCircle className="h-5 w-5"/>
                                    </Link>
                                </td>
                            </tr>)
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}