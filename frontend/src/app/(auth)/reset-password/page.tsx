"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/presentation/components/theme-toggle"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

const authRepository = new ApiAuthRepository(api)

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { theme, systemTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDarkMode = currentTheme === 'dark'

  useEffect(() => {
    if (!token || !email) {
      setTimeout(() => {
        router.push("/forgot-password")
      }, 2000)
    }
  }, [token, email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      setLoading(false)
      return
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.")
      setLoading(false)
      return
    }

    if (!/\d/.test(password)) {
      setError("A senha deve conter pelo menos 1 número.")
      setLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError("A senha deve conter pelo menos 1 letra maiúscula.")
      setLoading(false)
      return
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("A senha deve conter pelo menos 1 caractere especial.")
      setLoading(false)
      return
    }

    if (!/[a-z]/.test(password)) {
      setError("A senha deve conter pelo menos 1 letra minúscula.")
      setLoading(false)
      return
    }

    try {
      await authRepository.resetPassword({
        token: token!,
        email: email!,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSubmitted(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error resetting password:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao redefinir senha. Tente novamente."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717] transition-colors duration-300 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8">
          <div className="h-8 mb-4 mx-auto relative w-32">
             <Image
                src={isDarkMode ? "/assets/light-logo.png" : "/assets/dark-logo.png"}
                alt="Nexa Logo"
                fill
                className="object-contain"
             />
          </div>
          <div className="text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 py-4 rounded-lg">
            Link inválido ou expirado. Redirecionando...
          </div>
        </div>
      </div>
    )
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
              Sua senha foi redefinida com sucesso!
            </div>
            <span
              className="text-pink-600 font-bold text-base hover:underline cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Fazer login
            </span>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Redefinir senha
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-300 text-sm mb-6">
              Digite sua nova senha.
            </p>

            <form className="w-full" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-4 transition-colors bg-transparent border dark:border-gray-700 focus:border-pink-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Confirmar senha
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-4 transition-colors bg-transparent border dark:border-gray-700 focus:border-pink-500"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />

              <div className="mb-6 text-xs text-gray-600 dark:text-gray-400">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Pelo menos 1 número</li>
                  <li>Pelo menos 1 letra maiúscula</li>
                  <li>Pelo menos 1 letra minúscula</li>
                  <li>Pelo menos 1 caractere especial</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-full transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-4 text-sm flex flex-col gap-2">
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717]">
                Carregando...
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
