import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Global declaration for Pusher to avoid TS errors if needed
declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

if (typeof window !== 'undefined') {
  window.Pusher = Pusher
}

export const createEcho = (token: string) => {
  const backendApiUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://nexa-backend2-1044548850970.southamerica-east1.run.app/api'
  const backendRootUrl = backendApiUrl.replace(/\/api\/?$/, '')

  const wsHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost'
  const wsPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080)
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http'
  const forceTLS = scheme === 'https'
  const appKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY

  return new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${backendRootUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })
}
