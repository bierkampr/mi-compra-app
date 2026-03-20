/* --- ARCHIVO: app/api/auth/token/route.ts --- */
import { NextResponse } from 'next/server';
import { CLIENT_ID } from '@/lib/config'; // Importamos el ID único

export async function POST(request: Request) {
    try {
        const { code } = await request.json();
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;

        if (!client_secret) {
            console.error("❌ GOOGLE_CLIENT_SECRET no configurado en Vercel");
            return NextResponse.json({ error: 'Server secret missing' }, { status: 500 });
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: CLIENT_ID, // Usamos la variable unificada
                client_secret,
                grant_type: 'authorization_code',
                redirect_uri: 'postmessage',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Error de Google Auth:", data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}