// /api/auth/signup

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { supabase } from '@/supabaseClient';

export async function POST(request: NextRequest) {
    try {
        const { email, password, firstname, lastname, birthdate } = await request.json();

        if (!email || !password || !firstname || !lastname || !birthdate) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (data.user) {
            await prisma.users.create({
                data: {
                    id: data.user.id,
                    email,
                    firstname,
                    lastname,
                    birthdate: new Date(birthdate),
                    role: 'client',
                },
            });

            return NextResponse.json({ message: 'User successfully created', user: data.user }, { status: 201 });
        }

        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    } catch (error) {
        console.error('Error during signup:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}