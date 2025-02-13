import nodemailer from 'nodemailer';

const host = process.env.MAIL_HOST;
const port = parseInt(process.env.MAIL_PORT || "465", 10);
const user = process.env.MAIL_USER;
const mail = process.env.MAIL_ADDRESS;
const password = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user: mail, pass: password },
});

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const info = await transporter.sendMail({
            from: `"${user}" <${mail}>`,
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