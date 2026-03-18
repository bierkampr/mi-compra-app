import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { refresh_token } = await request.json();
        const client_id = "384386855540-b9gs1nuqt7jnd61bnh4881a7bk9ldcp1.apps.googleusercontent.com";
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;

        if (!client_secret) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Renovamos el access_token usando el refresh_token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token,
                client_id,
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
