import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Global declaration for Pusher to avoid TS errors if needed
declare global {
    interface Window {
        Pusher: any;
    }
}

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
}

export const createEcho = (token: string) => {
    return new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 80,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 443,
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};
