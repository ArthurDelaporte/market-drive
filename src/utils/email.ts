export async function sendStatusUpdateEmail(access_token: string, email: string, firstname: string | null, status: string) {
    const subject = "Mise à jour de votre commande";

    const STATUS_MESSAGES: Record<string, string> = {
        preparation: "Votre commande est en cours de préparation.",
        prepared: "Votre commande est a été préparée par le magasinier.",
        recovery: "Votre commande est prête en magasin, vous pouvez venir la récupérer.",
        delivery: "Votre commande est en cours de livraison.",
        delivered: "Votre commande a été livrée avec succès. Merci pour votre achat !",
        recovered: "Votre commande a été récupérée en magasin. Merci pour votre achat !"
    };

    const statusMessage = STATUS_MESSAGES[status] || "Mise à jour de votre commande.";

    const html = `
        <center>
            <img src="${process.env.NEXT_PUBLIC_API_URL}/img/logo/Logo_Gigadrive_color.png" alt="Logo GigaDrive"
             style="width:80px; height: 80px;">
        </center>
        <h2>Bonjour ${firstname || "Client"},</h2>
        <p>${statusMessage}</p>
        <p>Merci pour votre confiance et à bientôt !</p>
    `;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ to: email, subject, html }),
    });
}