"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createEcho } from "@/infrastructure/services/echo-service"
import { useAuth } from "./auth-provider"

interface EchoContextType {
  echo: any
}

const EchoContext = createContext<EchoContextType | undefined>(undefined)

export function EchoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [echo, setEcho] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (user && token && !echo) {
      const echoInstance = createEcho(token)
      setEcho(echoInstance)

      return () => {
        echoInstance.disconnect()
        setEcho(null)
      }
    }
  }, [user])

  return (
    <EchoContext.Provider value={{ echo }}>
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
