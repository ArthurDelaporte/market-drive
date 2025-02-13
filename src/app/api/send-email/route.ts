// /api/send-email/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sendEmail } from "@/lib/send-email";
import {getAuthenticatedUser} from "@/utils/auth";

export async function POST(req: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        const { data, error } = await sendEmail(to, subject, html);

        if (error) {
            return NextResponse.json({ error: "Erreur d'envoi d'email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, messageId: data?.messageId });
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}