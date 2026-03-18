import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();
        const client_id = "384386855540-b9gs1nuqt7jnd61bnh4881a7bk9ldcp1.apps.googleusercontent.com";
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;

        if (!client_secret) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Intercambiamos el código por tokens
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id,
                client_secret,
                grant_type: 'authorization_code',
                redirect_uri: 'postmessage', // Requerido por initCodeClient
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
