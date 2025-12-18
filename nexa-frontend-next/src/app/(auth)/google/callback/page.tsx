"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { toast } from "sonner"
import { handleGoogleCallbackRequest } from "@/infrastructure/api/google-auth"
import { useAuth } from "@/presentation/contexts/auth-provider"

export default function GoogleOAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      const processingFlag = sessionStorage.getItem("google_oauth_processing")
      if (processingFlag === "true") {
        return
      }

      sessionStorage.setItem("google_oauth_processing", "true")

      try {
        setStatus("loading")

        const code = searchParams.get("code")
        const oauthError = searchParams.get("error")

        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`)
        }

        if (!code) {
          router.push("/login")
          return
        }

        const role = sessionStorage.getItem("google_oauth_role") as "creator" | "brand" | null
        const isStudent = sessionStorage.getItem("google_oauth_is_student") === "true"

        const response = await handleGoogleCallbackRequest(code, role || undefined, isStudent)

        sessionStorage.removeItem("google_oauth_role")
        sessionStorage.removeItem("google_oauth_is_student")

        login(response.token, response.user)

        setStatus("success")

        if (response.user.role === "student") {
          toast.success("Conta de aluno criada! Complete a verificação para obter acesso gratuito.")
          router.push("/dashboard/student-verify")
          return
        }

        const isNewUser = !response.user.has_premium && response.user.role === "creator"

        if (isNewUser) {
          toast.success("Conta criada com sucesso!")
        } else {
          toast.success("Login realizado com sucesso com Google!")
        }

        router.push("/dashboard")
      } catch (err: any) {
        const message = err?.message || "Falha na autenticação Google OAuth"
        setError(message)
        setStatus("error")
      } finally {
        sessionStorage.removeItem("google_oauth_processing")
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  const handleRetry = () => {
    router.push("/login")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Fazendo seu login..."}
            {status === "success" && "Sucesso!"}
            {status === "error" && "Falha na Autenticação"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Aguarde enquanto completamos seu login...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">
                Login realizado com sucesso com Google!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para seu painel...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-muted-foreground">
                {error}
              </p>
              <div className="flex space-x-2 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  Tentar Novamente
                </Button>
                <Button onClick={handleGoHome}>
                  Ir para Início
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

