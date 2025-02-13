'use client';

import { useEffect, useState } from 'react';
import { getCookie } from 'typescript-cookie';
import { BarChart, Activity, Users, DollarSign } from "lucide-react";
import Header from '@/components/Header';
import {useRouter} from "next/navigation";

export default function AdminHomePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats] = useState({
        totalSales: '145,250€',
        activeUsers: '1,234',
        dailyOrders: '56',
        conversion: '15.3%'
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const accessToken = getCookie('access_token');
                if (!accessToken) {
                    return;
                }
                const response = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    console.error('Error fetching user data');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto">
                {/* Main Content */}
                <main className="py-12 px-4">
                    {/* Stats Grid */}
                    <div className="md:mt-12 mt-24">
                        <button className="mb-5 mr-2" onClick={() => router.push(`/admin/produits`)}>
                            <p>Voir les produits</p>
                        </button>
                        <button className="mb-5 mr-2"
                                onClick={() => router.push(`/admin/users`)}
                        >
                            Voir les utilisateurs
                        </button>
                        <button className="mb-5 mr-2"
                                onClick={() => router.push(`/admin/commandes`)}
                        >
                            Voir les commandes
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">
                                        Ventes Totales
                                    </h3>
                                    <DollarSign className="w-4 h-4 text-gray-600"/>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">
                                        Utilisateurs Actifs
                                    </h3>
                                    <Users className="w-4 h-4 text-gray-600"/>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">
                                        Commandes du Jour
                                    </h3>
                                    <BarChart className="w-4 h-4 text-gray-600"/>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.dailyOrders}</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-medium text-gray-600">
                                        Taux de Conversion
                                    </h3>
                                    <Activity className="w-4 h-4 text-gray-600"/>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.conversion}</p>
                            </div>
                        </div>

                        {/* Recent Orders Table */}
                        <div className="bg-white rounded-lg shadow-sm mt-6">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Commandes Récentes</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-gray-500">ID</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-500">Client</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-500">Produit</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-500">Montant</th>
                                        <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {[
                                        {
                                            id: '#12345',
                                            client: 'Jean Dupont',
                                            product: 'Produit A',
                                            amount: '99.99€',
                                            status: 'Complété'
                                        },
                                        {
                                            id: '#12346',
                                            client: 'Marie Martin',
                                            product: 'Produit B',
                                            amount: '149.99€',
                                            status: 'En cours'
                                        },
                                        {
                                            id: '#12347',
                                            client: 'Pierre Durant',
                                            product: 'Produit C',
                                            amount: '199.99€',
                                            status: 'En attente'
                                        }
                                    ].map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-900">{order.id}</td>
                                            <td className="p-4 text-sm text-gray-900">{order.client}</td>
                                            <td className="p-4 text-sm text-gray-900">{order.product}</td>
                                            <td className="p-4 text-sm text-gray-900">{order.amount}</td>
                                            <td className="p-4 text-sm text-gray-900">{order.status}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}