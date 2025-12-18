"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

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
  const router = useRouter()
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
  }, [])

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    setServerError(null)

    try {
      const response = await loginUseCase.execute(data)
      login(response.token, response.user)

      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      // Generic error message or specific from backend
      const message = error.response?.data?.message || "Credenciais inválidas. Verifique seu email e senha."
      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold">
              Bem-vindo(a) de volta à 
            </CardTitle>
            <Logo width={100} height={100} />
          </div>
          <CardDescription>
            Entre na sua conta para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" type="email" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
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
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Lembrar de mim
                      </label>
                    </div>
                  )}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {serverError && (
                <Alert variant="destructive">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
          <div className="flex items-center w-full gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <GoogleOAuthButton className="rounded-md" />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 justify-center text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/signup/creator" className="text-primary hover:underline">
              Sou Criador
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/signup/brand" className="text-primary hover:underline">
              Sou Marca
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
