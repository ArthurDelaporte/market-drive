"use client";

import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ScanMenu() {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // 🟢 Gestion du fichier image
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    // 📤 Envoi de l'image à OpenAI pour analyse
    const analyzeImage = async () => {
        if (!image) {
            toast.error("Veuillez sélectionner une image !");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", image);

        try {
            const response = await fetch("/api/chatgpt/image/route", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || "Erreur lors de l'analyse de l'image.");
                return;
            }

            setResult(data);
        } catch (error) {
            console.error("❌ Erreur analyse image :", error);
            toast.error("Une erreur est survenue. Réessayez plus tard.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 pt-24 text-center">
            <h1 className="text-3xl font-bold mb-6">📷 Scanner un Plat</h1>
            <ToastContainer />

            <div className="mb-4">
                <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            <button
                onClick={analyzeImage}
                className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                disabled={loading}
            >
                {loading ? "Analyse en cours..." : "Analyser l'image"}
            </button>

            {result && (
                <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2">Résultat :</h2>
                    <p><strong>Plat reconnu :</strong> {result.dish}</p>
                    <p><strong>Ingrédients :</strong> {result.ingredients.join(", ")}</p>
                    <p className="mt-4">
                        <strong>Disponibles en magasin :</strong> {result.availableIngredients.join(", ") || "Aucun"}
                    </p>
                </div>
            )}
        </div>
    );
}
