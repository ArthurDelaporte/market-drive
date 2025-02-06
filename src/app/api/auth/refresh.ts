import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            console.error("❌ [API] Aucun refresh_token trouvé !");
            return NextResponse.json({ error: "Refresh token missing" }, { status: 401 });
        }

        console.log("🔄 [API] Tentative de rafraîchissement avec refresh_token :", refreshToken);

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data.session) {
            console.error("❌ [API] Erreur lors du rafraîchissement de la session :", error);
            return NextResponse.json({ error: "Failed to refresh session" }, { status: 401 });
        }

        console.log("✅ [API] Session rafraîchie avec succès !");
        cookies().set("access_token", data.session.access_token, { path: "/" });

        return NextResponse.json({ message: "Session refreshed" });
    } catch (err) {
        console.error("❌ [API] Erreur serveur :", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
