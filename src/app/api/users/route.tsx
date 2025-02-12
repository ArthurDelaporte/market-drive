// /api/users

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';

// GET handler: Récupérer les users
export async function GET() {
    try {
        const users = await prisma.users.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}