import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

if (typeof window !== 'undefined') {
  window.Pusher = Pusher
}

export const createEcho = (token: string): InstanceType<typeof Echo> | null => {
  const backendApiUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://www.nexacreators.com/api'
  const backendRootUrl = backendApiUrl.replace(/\/api\/?$/, '')

  // Dynamic configuration to support both Local and Production environments
  // specific defaults based on the host value.
  const wsHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'nexa-chat-bwld7w5onq-rj.a.run.app'

  // Clean defaults: if localhost, use 8080/http. If production, use 443/https.
  // This allows missing .env variables in local dev to still work if HOST is set, 
  // or defaults completely to prod if nothing is set.
  const isLocal = wsHost === 'localhost' || wsHost === '127.0.0.1'

  const wsPort = process.env.NEXT_PUBLIC_REVERB_PORT
    ? Number(process.env.NEXT_PUBLIC_REVERB_PORT)
    : (isLocal ? 8080 : 443)

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME
    ? process.env.NEXT_PUBLIC_REVERB_SCHEME
    : (isLocal ? 'http' : 'https')

  const forceTLS = scheme === 'https'
  const appKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY

  if (!appKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        'NEXT_PUBLIC_REVERB_APP_KEY não configurada; recursos em tempo real desativados.'
      )
    }
    return null
  }

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
