// /api/auth/signin

import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password }: { email: string; password: string } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        const { session, user } = data;

        if (!session || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const response = NextResponse.json({ message: 'Login successful', user: { id: user.id } });

        // Ajout des cookies
        response.cookies.set('access_token', session.access_token, {
            maxAge: 7200, // 2 heures
            path: '/',
        });
        response.cookies.set('refresh_token', session.refresh_token, {
            maxAge: 60 * 60 * 24 * 30, // 30 jours
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error during signin:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}