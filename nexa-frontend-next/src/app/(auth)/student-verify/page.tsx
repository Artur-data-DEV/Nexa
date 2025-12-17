"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { ThemeToggle } from "@/presentation/components/theme-toggle"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/presentation/components/ui/alert"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { toast } from "sonner"

const authRepository = new ApiAuthRepository(api)

export default function StudentVerifyPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const isInsideCreatorDashboard = searchParams.get("embedded") === "true"

  useEffect(() => {
    if (user && !isInsideCreatorDashboard) {
      router.replace("/dashboard/student-verify?embedded=true")
    }
  }, [user, isInsideCreatorDashboard, router])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any)?.student_verified) {
      toast.success("Você já está verificado como aluno!")
      if (!isInsideCreatorDashboard) {
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    }
  }, [user, isInsideCreatorDashboard, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError(null)
  }

  const handleSkip = () => {
    toast.info("Pulando verificação de aluno. Você pode verificar seu status posteriormente no dashboard.")
    router.push("/dashboard")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any)?.student_verified) {
      toast.info("Você já está verificado como aluno!")
      router.push("/dashboard")
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const requiredFields = ["username", "email"]
      const missingFields = requiredFields.filter(field => !form[field as keyof typeof form].trim())
      
      if (missingFields.length > 0) {
        setError("Por favor, preencha todos os campos obrigatórios.")
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email)) {
        setError("Por favor, insira um e-mail válido.")
        return
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await authRepository.verifyStudent({
            email: form.email,
            username: form.username,
            courseName: "Build Creators"
        })
        
        const data = res?.data || res || {}
        
        if (data?.success) {
          toast.success(data?.message || "Solicitação registrada com sucesso! Aguarde a aprovação do administrador.")
          
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          toast.info(data?.message || "Solicitação registrada. Nossa equipe validará seu acesso de aluno.")
        }
      } catch (e: any) {
        const errorMessage = e?.response?.data?.message || "Erro ao verificar. Tente novamente."
        
        if (e?.response?.status === 422) {
          setError(errorMessage)
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (err: any) {
      console.error("Student verification error:", err)
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || "Erro do servidor"
        setError(errorMessage)
      } else {
        setError(err.message || "Erro ao verificar status de aluno. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isVerified = (user as any)?.student_verified

  return (
    <div className={isInsideCreatorDashboard ? "p-6 w-full min-h-[92vh] flex justify-center items-center" : "min-h-screen flex items-center justify-center bg-muted py-8 px-2 dark:bg-background relative"}>
      {!isInsideCreatorDashboard && (
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
      )}
      <div className={`w-full max-w-2xl bg-background rounded-xl shadow-lg relative border ${isInsideCreatorDashboard ? "p-6" : "p-8 md:p-12"}`}>
        <h1 className={`font-bold mb-2 text-foreground ${isInsideCreatorDashboard ? "text-xl" : "text-2xl md:text-3xl"}`}>
          Preencha os dados se você for aluna do Build Creators
        </h1>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm md:text-base">
          {isVerified
            ? "Você já foi verificado como aluno! Redirecionando para o painel..."
            : "Preencha suas informações educacionais abaixo para verificar seu status de aluno e obter acesso gratuito por até 12 meses."
          }
        </p>
        <Alert className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-2 bg-[#FAF5FF] dark:bg-[#30253d]">
          <div className="flex-1">
            <AlertTitle className="font-semibold text-primary text-sm md:text-base">
              <span className="mr-2 text-[#A873E9]">ⓘ</span>Os alunos do curso recebem acesso 100% gratuito!
            </AlertTitle>
          </div>
          <AlertDescription className="text-xs md:text-sm text-muted-foreground">
            Não perca.
          </AlertDescription>
        </Alert>

        {isVerified && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <AlertDescription className="text-green-600 dark:text-green-400">
              ✅ Você já está verificado como aluno! Redirecionando para o dashboard...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isVerified ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs text-muted-foreground">Nome de usuário</label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Seu nome de usuário"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs text-muted-foreground">E-mail</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-[#E91E63] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                "Enviar para verificação"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSkip}
              className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Pular por enquanto
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
