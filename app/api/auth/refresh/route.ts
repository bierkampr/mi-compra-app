/* --- ARCHIVO: app/api/auth/refresh/route.ts --- */
import { NextResponse } from 'next/server';
import { CLIENT_ID } from '@/lib/config';

export async function POST(request: Request) {
    try {
        const { refresh_token } = await request.json();
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;

        if (!client_secret) return NextResponse.json({ error: 'Secret missing' }, { status: 500 });

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token,
                client_id: CLIENT_ID, // Usamos la variable unificada
                client_secret,
                grant_type: 'refresh_token',
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}