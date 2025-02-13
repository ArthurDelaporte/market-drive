"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {getCookie} from "typescript-cookie";

export default function AppointmentForm({ user_id, cart_id }) {
    const [date, setDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (date) {
            fetch(`/api/appointments?date=${date}`, {
                headers: {
                    Authorization: `Bearer ${getCookie('access_token')}`,
                }
            })
                .then((res) => res.json())
                .then((data) => {
                    setAvailableSlots(data.availableSlots);
                });
        }
    }, [date]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTime) {
            setError("Veuillez sélectionner un créneau.");
            return;
        }

        // 📌 Séparer date et heure pour correspondre au modèle
        const formattedDate = format(new Date(date), "yyyy-MM-dd"); // Stocke YYYY-MM-DD
        // const formattedTime = selectedTime;

        const res = await fetch("/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie('access_token')}`
            },
            body: JSON.stringify({ user_id, cart_id, date: formattedDate, time: selectedTime }),
        });

        const data = await res.json();
        if (data.error) {
            setError(data.error);
        } else {
            alert("Rendez-vous confirmé !");
            router.push("/commandes");
        }
    };

    return (
        <div className="p-6 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Prendre un rendez-vous</h2>

            {error && <p className="text-red-500 mb-3">{error}</p>}

            <form onSubmit={handleSubmit}>
                <label className="block mb-2">Sélectionner une date :</label>
                <input
                    type="date"
                    min={format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd")}
                    max={format(new Date(new Date().setDate(new Date().getDate() + 7)), "yyyy-MM-dd")}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border p-2 rounded w-full mb-4"
                />

                {date && (
                    <>
                        <label className="block mb-2">Sélectionner un créneau :</label>
                        <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="border p-2 rounded w-full mb-4"
                        >
                            <option value="">Choisir un créneau</option>
                            {availableSlots
                                .filter((slot) => slot.available > 0)
                                .map((slot) => (
                                    <option key={slot.time} value={slot.time}>
                                        {slot.time} ({slot.available} places disponibles)
                                    </option>
                                ))}
                        </select>
                    </>
                )}

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Réserver
                </button>
            </form>
        </div>
    );
}