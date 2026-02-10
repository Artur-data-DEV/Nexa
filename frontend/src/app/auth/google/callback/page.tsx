"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle, User as UserIcon, Briefcase, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Label } from "@/presentation/components/ui/label"
import { toast } from "sonner"
import { handleGoogleCallbackRequest, completeGoogleRegistration } from "@/infrastructure/api/google-auth"
import { useAuth } from "@/presentation/contexts/auth-provider"
import type { AxiosError } from "axios"
import Image from "next/image"

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Fazendo seu login...</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Aguarde enquanto completamos seu login...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <GoogleOAuthCallbackInner />
    </Suspense>
  )
}

const processedCodes = new Set<string>()

function GoogleOAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "role_selection">("loading")
  const [error, setError] = useState("")
  
  // Role Selection State
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [googleUser, setGoogleUser] = useState<{name: string, email: string, avatar: string} | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Step 2: Details
  const [selectedRole, setSelectedRole] = useState<"creator" | "brand" | null>(null)
  const [whatsapp, setWhatsapp] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    const oauthError = searchParams.get("error")

    if (!code && !oauthError) {
      return
    }

    if (code && processedCodes.has(code)) {
        return
    }

    if (code) {
        processedCodes.add(code)
    }
    
    const handleCallback = async () => {
      try {
        setStatus("loading")

        if (oauthError) {
          const known =
            oauthError === "access_denied"
              ? "Acesso negado pelo Google"
              : oauthError === "invalid_request"
              ? "Requisição inválida (verifique client_id e escopos)"
              : `Erro OAuth: ${oauthError}`
          throw new Error(known)
        }

        const role = sessionStorage.getItem("google_oauth_role") as "creator" | "brand" | null
        const isStudent = sessionStorage.getItem("google_oauth_is_student") === "true"

        const response = await handleGoogleCallbackRequest(code!, role || undefined, isStudent)

        sessionStorage.removeItem("google_oauth_role")
        sessionStorage.removeItem("google_oauth_is_student")

        // Check for Role Selection Action
        if (response.success && response.action === 'role_selection' && response.registration_id) {
             setRegistrationId(response.registration_id)
             if (response.google_user) setGoogleUser(response.google_user)
             setStatus("role_selection")
             return
        }

        if (!response?.token || !response?.user) {
          throw new Error("Resposta inválida do servidor")
        }
        await login(response.token, response.user)

        setStatus("success")

        if ((response.user.role as string) === "student") {
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
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ message?: string; error?: string }>
        
        // Ignore "invalid_grant" if we already succeeded (race condition artifact)
        if (axiosError.response?.data?.error === 'invalid_grant' || 
            axiosError.message?.includes('invalid_grant')) {
             console.warn("Ignored invalid_grant error likely due to double submission")
             return
        }

        const message = axiosError.response?.data?.message || axiosError.message || "Falha na autenticação Google OAuth"
        setError(message)
        setStatus("error")
        toast.error(message)
      } finally {
        // We do NOT remove from processedCodes to prevent re-execution on same page session
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  const handleSelectRole = (role: "creator" | "brand") => {
      setSelectedRole(role)
  }

  const handleBack = () => {
      setSelectedRole(null)
      setWhatsapp("")
  }

  const handleConfirm = async () => {
      if (!registrationId || !selectedRole) return
      
      const cleanWhatsapp = whatsapp.replace(/\D/g, "")
      if (cleanWhatsapp.length < 10) {
          toast.error("Por favor, insira um número de WhatsApp válido com DDD")
          return
      }
      
      setIsRegistering(true)
      try {
          const response = await completeGoogleRegistration(registrationId, selectedRole, whatsapp)
           if (!response?.token || !response?.user) {
              throw new Error("Falha ao criar conta")
           }
           await login(response.token, response.user)
           toast.success(`Conta de ${selectedRole === 'creator' ? 'Criador' : 'Marca'} criada com sucesso!`)
           router.push("/dashboard")
      } catch (err: unknown) {
          const axiosError = err as AxiosError<{ message?: string }>
          const msg =
              axiosError.response?.data?.message ||
              axiosError.message ||
              "Erro ao finalizar cadastro"
          toast.error(msg)
          setError(msg)
      } finally {
          setIsRegistering(false)
      }
  }

  const handleRetry = () => {
    router.push("/login")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  if (status === "role_selection") {
      return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center space-y-4">
                {googleUser?.avatar && (
                    <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <Image src={googleUser.avatar} alt="Avatar" width={80} height={80} />
                    </div>
                )}
              <CardTitle className="text-2xl font-bold">Quase lá, {googleUser?.name?.split(' ')[0]}!</CardTitle>
              <CardDescription className="text-base">
                {selectedRole 
                    ? `Finalize seu perfil de ${selectedRole === 'creator' ? 'Criador' : 'Marca'}`
                    : "Como você deseja utilizar a Nexa?"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!selectedRole ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleSelectRole('creator')}
                            disabled={isRegistering}
                            className="flex flex-col items-center justify-center p-6 space-y-4 rounded-xl border-2 border-transparent bg-secondary/50 hover:bg-secondary hover:border-pink-500 hover:shadow-lg transition-all group"
                        >
                            <div className="p-4 rounded-full bg-pink-100 dark:bg-pink-900/20 group-hover:scale-110 transition-transform">
                                <UserIcon className="w-8 h-8 text-pink-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Sou Criador</h3>
                                <p className="text-xs text-muted-foreground mt-1">Quero encontrar campanhas e monetizar meu conteúdo</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleSelectRole('brand')}
                            disabled={isRegistering}
                            className="flex flex-col items-center justify-center p-6 space-y-4 rounded-xl border-2 border-transparent bg-secondary/50 hover:bg-secondary hover:border-purple-500 hover:shadow-lg transition-all group"
                        >
                            <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-8 h-8 text-purple-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Sou Marca</h3>
                                <p className="text-xs text-muted-foreground mt-1">Quero contratar criadores para divulgar meus produtos</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg text-primary mb-4">
                             {selectedRole === 'creator' ? <UserIcon className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                             <span className="font-medium">Você escolheu: {selectedRole === 'creator' ? 'Criador' : 'Marca'}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input 
                                id="whatsapp"
                                placeholder="(11) 99999-9999"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Necessário para comunicação sobre campanhas.</p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button onClick={handleConfirm} disabled={isRegistering} className="w-full">
                                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isRegistering ? "Criando conta..." : "Confirmar e Criar Conta"}
                            </Button>
                            <Button onClick={handleBack} variant="ghost" disabled={isRegistering} className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar e escolher outro perfil
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
      )
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
