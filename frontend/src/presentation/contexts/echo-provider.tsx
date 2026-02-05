"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { createEcho } from "@/infrastructure/services/echo-service"
import { useAuth } from "./auth-provider"

type EchoInstance = ReturnType<typeof createEcho>

interface EchoContextType {
  echo: EchoInstance | null
  isConnected: boolean
}

const EchoContext = createContext<EchoContextType | undefined>(undefined)

export function EchoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [echo, setEcho] = useState<EchoInstance | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const echoInstanceRef = useRef<EchoInstance | null>(null)

  const initializeEcho = (token: string) => {
    if (echoInstanceRef.current) {
      return
    }

    const echoInstance = createEcho(token)
    if (!echoInstance) {
      return
    }

    const connector: any = (echoInstance as any).connector
    const pusher = connector && (connector as any).pusher
    if (pusher && pusher.connection) {
      pusher.connection.bind('connected', () => {
        setIsConnected(true)
      })
      pusher.connection.bind('disconnected', () => {
        setIsConnected(false)
      })
      pusher.connection.bind('error', () => {
        setIsConnected(false)
      })
    }

    if (typeof window !== 'undefined') {
       ;(window as Window & { Echo?: EchoInstance }).Echo = echoInstance
    }

    echoInstanceRef.current = echoInstance
    setEcho(echoInstance)
  }

  useEffect(() => {
    const token = sessionStorage.getItem("auth_token")
    if (user?.id && token) {
      initializeEcho(token)
    } else {
        if (echoInstanceRef.current) {
            echoInstanceRef.current.disconnect()
            echoInstanceRef.current = null
            setEcho(null)
            setIsConnected(false)
        }
    }

    return () => {
        // Cleanup handled by ref check
    }
  }, [user?.id])

  return (
    <EchoContext.Provider value={{ echo, isConnected }}>
      {children}
    </EchoContext.Provider>
  )
}

export const useEcho = () => {
  const context = useContext(EchoContext)
  if (!context) {
    throw new Error("useEcho must be used within an EchoProvider")
  }
  return context
}
