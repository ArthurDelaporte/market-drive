import { NextResponse } from "next/server";
import prisma from "@/prismaClient";

/**
 * 📩 API POST pour enregistrer un ticket de contact
 */
export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        // 🔹 Validation des champs requis
        if (!name || !email || !message) {
            return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
        }

        // 🔹 Enregistrer le ticket dans la base de données
        const ticket = await prisma.tickets.create({
            data: { name, email, message },
        });

        return NextResponse.json({ success: true, ticket }, { status: 201 });
    } catch (error) {
        console.error("❌ Erreur lors de la création du ticket :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}