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
    'https://nexa-backend2-1044548850970.southamerica-east1.run.app/api'
  const backendRootUrl = backendApiUrl.replace(/\/api\/?$/, '')

  const wsHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'nexa-chat-bwld7w5onq-rj.a.run.app'
  const wsPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 443)
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https'
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
