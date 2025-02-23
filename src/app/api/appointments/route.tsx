import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prismaClient";
import { addDays, startOfDay, format } from "date-fns";
import {getAuthenticatedUser} from "@/utils/auth";
import { sendEmail } from "@/utils/email";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
const SLOT_DURATION = 30; // 30 minutes
const MAX_APPOINTMENTS_PER_SLOT = 3;

/**
 * 🔍 Vérifier les disponibilités pour une date donnée
 */
export async function GET(req: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");

        if (!dateStr) {
            return NextResponse.json({ error: "Date requise" }, { status: 400 });
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: "Date invalide" }, { status: 400 });
        }

        const startOfDay = new Date(dateStr + "T00:00:00.000Z");
        const endOfDay = new Date(dateStr + "T23:59:59.999Z");

        const appointments = await prisma.appointments.findMany({
            where: {
                date: {
                    gte: startOfDay, // Date >= 00:00:00
                    lte: endOfDay, // Date <= 23:59:59
                },
            },
            select: { time: true },
        });

        const availableSlots: { time: string; available: number }[] = [];
        for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
            for (let min = 0; min < 60; min += SLOT_DURATION) {
                const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
                const count = appointments.filter(appt => appt.time === time).length;
                availableSlots.push({ time, available: MAX_APPOINTMENTS_PER_SLOT - count });
            }
        }

        return NextResponse.json({ availableSlots });
    } catch (error) {
        console.error("❌ Erreur GET /api/appointments :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * 📅 Créer un rendez-vous
 */
export async function POST(req: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { user_id, cart_id, date, time, is_retrait, address } = await req.json();

        if (!user_id || !cart_id || !date || !time || typeof is_retrait !== "boolean") {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        let newAddress = address.trim()

        if (!address) {
            newAddress = "28, place de la Bourse, Palais Brongniart, 75002 Paris"
        }

        const cart_appointment_exists = await prisma.appointments.findMany({
            where: {
                cart_id: cart_id,
            }
        })

        if (cart_appointment_exists.length > 0) {
            return NextResponse.json({ error: "Rendez-vous déjà pris pour ce panier" }, { status: 400 });
        }

        // Vérifier si le format de l'heure est correct (HH:mm)
        if (!/^\d{2}:\d{2}$/.test(time)) {
            return NextResponse.json({ error: "Format d'heure invalide (HH:mm)" }, { status: 400 });
        }

        const appointmentDate = new Date(date);
        const formattedDate = format(appointmentDate, "yyyy-MM-dd");

        const today = startOfDay(new Date());

        // ✅ Ajuster le fuseau horaire en ajoutant 1 ou 2 heures (selon l'heure d'été ou hiver)
        const franceOffset = new Date().getTimezoneOffset() === -120 ? 2 : 1; // Vérifie si on est en heure d'été ou hiver
        const minDate = addDays(today, 1);
        const maxDate = addDays(today, 7);

        minDate.setHours(franceOffset, 0, 0, 0);
        maxDate.setHours(franceOffset, 0, 0, 0);

        if (appointmentDate < minDate || appointmentDate > maxDate) {
            return NextResponse.json({ error: "Date hors plage autorisée" }, { status: 400 });
        }

        const [hour, minutes] = time.split(":").map(Number);
        if (hour < 9 || hour >= 20 || (hour === 19 && minutes > 30)) {
            return NextResponse.json({ error: "Heure hors plage autorisée (9h00 - 19h30)" }, { status: 400 });
        }

        const existingAppointments = await prisma.appointments.count({
            where: {
                date: new Date(formattedDate),
                time,
            },
        });

        if (existingAppointments >= MAX_APPOINTMENTS_PER_SLOT) {
            return NextResponse.json({ error: "Créneau complet" }, { status: 400 });
        }

        // Récupérer les infos utilisateur et panier
        const user = await prisma.users.findUnique({
            where: { id: user_id },
            select: { email: true, firstname: true },
        });

        const cart = await prisma.carts.findUnique({
            where: { id: cart_id },
            select: { products: true, amount: true },
        });

        if (!user || !cart) {
            return NextResponse.json({ error: "Utilisateur ou panier introuvable" }, { status: 500 });
        }

        // Construire l'email
        const subject = "Confirmation de votre rendez-vous";
        const cartProducts = (() => {
            if (Array.isArray(cart.products)) return cart.products;
            if (typeof cart.products === "string") return JSON.parse(cart.products);
            return [];
        })();

        // ✅ Extraire les IDs uniques des produits
        const productIds = [...new Set(cartProducts.map((p: { product_id: string }) => p.product_id))] as string[];

        if (productIds.length === 0) {
            return NextResponse.json({ error: "Aucun produit dans le panier." }, { status: 400 });
        }

        // ✅ Récupérer les produits correspondants en BDD
        const products = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, quantity: true },
        });

        const productsWithTotalPrice = products.map((product) => ({
            ...product,
            total_price: parseFloat(((product.price || 1) * (product.quantity || 0)).toFixed(2)), // Assure qu'il n'y a pas d'erreur si `price` ou `quantity` est `null`
        }));

        // ✅ Construire la liste HTML avec les infos complètes
        const rows = cartProducts.map((p: { product_id: string, quantity: number }) => {
            const product = productsWithTotalPrice.find(prod => prod.id === p.product_id);
            return product
                ? `<tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.total_price}€</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${((product.total_price || 0) * p.quantity).toFixed(2)}€</td>
                </tr>`
                : `<tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Produit inconnu</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00€</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">0.00€<</td>
                </tr>`;
        }).join("");

        const optionsDate: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };

        const newFormattedDate = new Date(formattedDate).toLocaleDateString('fr-FR', optionsDate);

        const html = `
            <center>
                <img src="${process.env.NEXT_PUBLIC_API_URL}/img/logo/Logo_Gigadrive_color.png" alt="Logo GigaDrive"
                 style="width:80px; height: 80px;">
            </center>
            <h2>Bonjour ${user.firstname || "Client"},</h2>
            ${is_retrait ?
            '<p>Votre rendez-vous pour récupérer votre commande est confirmé :</p>' :
            '<p>Votre rendez-vous pour la livraison de votre commande est confirmé :</p>'}
            <p style="margin-left: 15px">📍 <strong>Adresse :</strong> ${newAddress}</p>
            <p style="margin-left: 15px">📅 <strong>Date :</strong> ${newFormattedDate}</p>
            <p style="margin-left: 15px">🕒 <strong>Heure :</strong> ${time}</p>
            <h3>🛒 Récapitulatif de votre commande :</h3>
            <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Produit</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Prix</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantité</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <p>💰<strong>Total :</strong> ${cart.amount?.toFixed(2)} €</p>
            <p>Merci et à bientôt !</p>
        `;

        await sendEmail(user.email || '', subject, html);

        const newAppointment = await prisma.appointments.create({
            data: { user_id, cart_id, date: new Date(formattedDate), time, is_retrait, address: newAddress },
        });

        await prisma.carts.update({
            where: { id: cart_id },
            data: { status: "validated" },
        })

        return NextResponse.json({ success: true, appointment: newAppointment });
    } catch (error) {
        console.error("❌ Erreur dans POST /api/appointments :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}