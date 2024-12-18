// /api/auth/logout

import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";

export async function POST() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error during sign out:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const response = NextResponse.json({ message: "Logout successful" }, { status: 200 });

        response.cookies.delete("access_token");

        return response;
    } catch (err) {
        console.error("Unexpected error during logout:", (err as Error).message);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}