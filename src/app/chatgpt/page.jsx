"use client";

import { useState } from "react";

const ChatGPTVersion = () => {
  const [response, setResponse] = useState("");
  const [basketItems] = useState([]); // Exemple de données

  const fetchChatGPTResponse = async () => {
    try {
      const res = await fetch("/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basketItems }),
      });
      const data = await res.json();
      setResponse(data.recipe);
    } catch (error) {
      console.error("Erreur lors de la récupération de la recette :", error);
    }
  };

  return (
    <div>
      <h1>Version ChatGPT</h1>
      <button onClick={fetchChatGPTResponse}>Générer une recette</button>
      {response && (
        <div>
          <h2>Résultat :</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default ChatGPTVersion;
