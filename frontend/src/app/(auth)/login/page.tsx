"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Building2, CameraIcon, CameraOff, Loader2, LucideBriefcaseBusiness, UserStar } from "lucide-react"

import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Checkbox } from "@/presentation/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/presentation/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"

import { LoginUseCase } from "@/application/use-cases/login.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { Logo } from "@/presentation/components/logo"
import { GoogleOAuthButton } from "@/presentation/components/auth/google-oauth-button"
import { FcBinoculars, FcBriefcase, FcBusiness, FcCamcorderPro, FcClapperboard, FcOldTimeCamera } from "react-icons/fc"

// Dependency Injection
const authRepository = new ApiAuthRepository(api)
const loginUseCase = new LoginUseCase(authRepository)

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  remember: z.boolean().optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717]">
          Carregando...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  useEffect(() => {
    // Clear any stale state on mount
    localStorage.removeItem("auth_token")
    const hasSensitiveQuery =
      typeof searchParams.get("password") === "string" ||
      typeof searchParams.get("email") === "string"
    if (hasSensitiveQuery) {
      setServerError("Por segurança, não aceitamos credenciais na URL. Digite seu email e senha no formulário.")
      router.replace("/login")
    }
  }, [])

  const onSubmit = async (data: LoginFormValues) => {
    if (loading) return
    setLoading(true)
    setServerError(null)

    try {
      const response = await loginUseCase.execute(data)
      await login(response.token, response.user) // Wait for auth state to update

      router.push("/dashboard")
    } catch (error: any) {
      const status = error?.response?.status
      const code = error?.code
      const isNetworkError = !error?.response || error?.message === "Network Error" || code === "ECONNABORTED"
      const validationErrors = error?.response?.data?.errors
      const validationMessage =
        status === 422
          ? (validationErrors?.email?.[0] ||
            validationErrors?.password?.[0] ||
            error?.response?.data?.message)
          : null

      if (typeof window !== "undefined") {
        console.error("Login error", {
          message: error?.message,
          code,
          status,
          url: error?.config?.url,
          method: error?.config?.method,
          data: error?.response?.data,
        })
      }

      const message =
        isNetworkError
          ? "Não foi possível conectar ao servidor. Tente novamente em alguns minutos."
          : status >= 500
            ? "Servidor indisponível no momento. Tente novamente em instantes."
            : status === 429
              ? "Muitas tentativas. Aguarde um pouco e tente novamente."
              : validationMessage || error?.response?.data?.message || "Credenciais inválidas. Verifique seu email e senha."
      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Premium Background Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

      <Card className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo width={120} height={40} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Bem-vindo(a) de volta
            </CardTitle>
            <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Entre na sua conta para acessar o painel.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        disabled={loading}
                        className="bg-zinc-100/50 dark:bg-white/5 border-2 border-zinc-200 dark:border-white/10 focus-visible:ring-pink-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="******"
                        disabled={loading}
                        className="bg-zinc-100/50 dark:bg-white/5 border-2 border-zinc-200 dark:border-white/10 focus-visible:ring-pink-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                        className="border-foreground/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-muted-foreground"
                      >
                        Lembrar de mim
                      </label>
                    </div>
                  )}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {serverError && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25 h-11 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar na plataforma"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-muted-foreground/50">ou</span>
            </div>
          </div>

          <div className={loading ? "pointer-events-none opacity-60" : ""}>
            <GoogleOAuthButton className="rounded-xl border-white/5 bg-background/40 hover:bg-background/60 transition-all font-semibold" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            Ainda não tem uma conta?
          </p>
          <div className="flex gap-4 text-sm w-full">
            <Link
              href="/signup/creator"
              className="flex-1 align-middle gap-1 flex items-center justify-center p-2 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500/20 transition-all font-semibold"
            >
              Sou Criador
              <UserStar size={20} />

            </Link>
            <Link
              href="/signup/brand"
              className="flex-1 align-middle gap-1 flex items-center justify-center p-2 rounded-lg bg-purple-600/10 text-purple-600 border border-purple-600/20 hover:bg-purple-600/20 transition-all font-semibold"
            >

              Sou Empresa
              <Building2 size={20} />

            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
