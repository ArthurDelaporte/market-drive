"use client";

import { useState } from "react";

const GeminiVersion = () => {
  const [response, setResponse] = useState("");
  const [ingredients, setIngredients] = useState(["tomates", "poulet", "fromage"]);

  const fetchGeminiResponse = async () => {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basketItems: ingredients }),
      });
      const data = await res.json();
      setResponse(data.recipe);
    } catch (error) {
      console.error("Erreur lors de la récupération de la recette :", error);
    }
  };

  return (
    <div>
      <h1>Version Gemini</h1>
      <textarea
        rows="4"
        cols="50"
        value={ingredients.join(", ")}
        onChange={(e) => setIngredients(e.target.value.split(",").map((item) => item.trim()))}
      ></textarea>
      <br />
      <button onClick={fetchGeminiResponse}>Générer une recette</button>
      {response && (
        <div>
          <h2>Résultat :</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiVersion;
