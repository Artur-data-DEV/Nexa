"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/presentation/components/theme-toggle"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import type { AxiosError } from "axios"

const authRepository = new ApiAuthRepository(api)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { theme, systemTheme } = useTheme()
  const router = useRouter()
  
  // Logic for logo based on theme might need adjustment depending on how useTheme works in Next.js
  // Usually resolvedTheme gives the actual active theme
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDarkMode = currentTheme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await authRepository.forgotPassword(email) as { status?: boolean; message?: string }
      
      if (data.status || data.message) { // Laravel usually returns status or message
        setSubmitted(true)
      } else {
        alert(data.message || "Email não encontrado. Tente novamente.")
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      console.error("Error sending reset link:", error)
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Algo deu errado. Tente novamente mais tarde."
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717] transition-colors duration-300 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8 flex flex-col items-center">
        <div className="h-8 mb-4 relative w-32 cursor-pointer" onClick={() => router.push("/")}>
             <Image
                src={isDarkMode ? "/assets/light-logo.png" : "/assets/dark-logo.png"}
                alt="Nexa Logo"
                fill
                className="object-contain"
                priority
             />
        </div>

        {submitted ? (
          <>
            <div className="text-green-600 dark:text-green-400 text-center mb-4 bg-[#19B95426] py-4 rounded-lg">
              Um email foi enviado para você com um link para redefinir sua senha.
              Verifique sua caixa de entrada (ou a pasta de spam).
            </div>
            <span
              className="text-pink-600 font-bold text-base hover:underline cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Voltar para login
            </span>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-300 text-sm mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>

            <form className="w-full" onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-6 transition-colors bg-transparent border dark:border-gray-700 focus:border-pink-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-full transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-2 text-sm flex flex-col gap-2">
          <div className="flex justify-center gap-2">
            <span className="text-gray-700 dark:text-gray-200">
              Lembrou sua senha?
            </span>
            <Link href="/login" className="text-pink-600 font-semibold hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
