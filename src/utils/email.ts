import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "465", 10),
    secure: true,
    auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * 📧 Fonction d'envoi d'email
 */
export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const info = await transporter.sendMail({
            from: `"Support" <${process.env.MAIL_ADDRESS}>`,
            to,
            subject,
            html,
        });

        return { data: info, error: null };
    } catch (error) {
        console.error("❌ Erreur d'envoi d'email :", error);
        return { data: null, error };
    }
}

/**
 * 📧 Fonction d'envoi d'email pour le changement de status d'une commande
 */
export async function sendStatusUpdateEmail(email: string, firstname: string | null, status: string) {
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

    await sendEmail(email, subject, html);
}