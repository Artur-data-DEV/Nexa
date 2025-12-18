"use client"

import { api } from "./axios-adapter"

export async function getGoogleOAuthUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
  const rootUrl = backendUrl.replace(/\/api\/?$/, "")

  const response = await api.get<{ success: boolean; redirect_url: string }>("/google/redirect", {
    baseURL: `${rootUrl}/api`,
  })

  if (!response.success || !response.redirect_url) {
    throw new Error("Falha ao obter URL do Google OAuth")
  }

  return response.redirect_url
}

export async function handleGoogleCallbackRequest(code: string, role?: "creator" | "brand", isStudent?: boolean) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"
  const rootUrl = backendUrl.replace(/\/api\/?$/, "")

  const params = new URLSearchParams({ code })

  if (role) {
    params.append("role", role)
  }

  if (isStudent) {
    params.append("is_student", "true")
  }

  const response = await api.get<{
    success: boolean
    message?: string
    user: any
    token: string
  }>(`/google/callback?${params.toString()}`, {
    baseURL: `${rootUrl}/api`,
  })

  if (!response.success) {
    throw new Error(response.message || "Falha na autenticação com Google")
  }

  return response
}

