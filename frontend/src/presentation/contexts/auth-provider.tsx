"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@/domain/entities/user"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (token: string, user: User) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authRepository = new ApiAuthRepository(api)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = sessionStorage.getItem("auth_token")
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Ensure CSRF cookie is set for stateful requests (if any)
      await authRepository.csrf()
      const userData = await authRepository.me()
      setUser(userData)
    } catch (error) {
      console.error("Failed to fetch user", error)
      sessionStorage.removeItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (token: string, userData: User) => {
    sessionStorage.setItem("auth_token", token)
    try {
      await authRepository.csrf()
      const fresh = await authRepository.me()
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...fresh, avatar: fresh.avatar ? `${fresh.avatar}${bust}` : fresh.avatar }
      setUser(nextUser)
    } catch {
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...userData, avatar: userData.avatar ? `${userData.avatar}${bust}` : userData.avatar }
      setUser(nextUser)
    }
    // router.push("/dashboard")
  }

  const refreshUser = async () => {
    try {
      const userData = await authRepository.me()
      setUser(userData)
    } catch (error) {
      console.error("Failed to refresh user", error)
    }
  }

  const logout = async () => {
    try {
      await authRepository.logout()
    } catch (error) {
      console.error("Logout error", error)
    } finally {
      sessionStorage.removeItem("auth_token")
      setUser(null)
      router.push("/login")
    }
  }

  const updateUser = (userData: User) => {
    setUser(userData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
