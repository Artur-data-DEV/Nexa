"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Loader2, ArrowRight, ArrowLeft, Smartphone, Mail } from "lucide-react"
import { toast } from "sonner"

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
import { PhoneInput } from "@/presentation/components/ui/phone-input"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { Logo } from "@/presentation/components/logo"
import { GoogleOAuthButton } from "@/presentation/components/auth/google-oauth-button"

import { RegisterCreatorUseCase } from "@/application/use-cases/register-creator.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { useAuth } from "@/presentation/contexts/auth-provider"

const authRepository = new ApiAuthRepository(api)
const registerCreatorUseCase = new RegisterCreatorUseCase(authRepository)

// Schema Validation
const signUpSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter ao menos um caractere especial."),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
  verificationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

export default function CreatorSignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading: authLoading, login } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formLoading, setFormLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  
  // Verification State
  const [verificationSent, setVerificationSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [code, setCode] = useState("")

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectTo = searchParams.get("redirectTo")
      router.replace(redirectTo || "/dashboard")
    }
  }, [isAuthenticated, authLoading, router, searchParams])

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      nome: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
      terms: false,
      verificationCode: "",
    },
    mode: "onChange",
  })

  const onSubmit = async (data: SignUpFormValues) => {
    if (!isVerified) {
        toast.error("Por favor, verifique seu contato antes de continuar.")
        return
    }

    setFormLoading(true)
    setServerError(null)

    try {
      const { nome, email, whatsapp, password } = data
      
      const auth = await registerCreatorUseCase.execute({
        name: nome,
        email,
        whatsapp,
        password,
        password_confirmation: password, // Laravel expectation
      })
      login(auth.token, auth.user)
      toast.success("Conta criada com sucesso!")
      const redirectTo = searchParams.get("redirectTo")
      router.replace(redirectTo || "/dashboard")
    } catch (error) {
      type ApiErrorData = { message?: string; errors?: Record<string, string[]> }
      type ApiError = { response?: { data?: ApiErrorData } }
      const err = error as ApiError
      const apiErrors = err?.response?.data?.errors
      if (apiErrors && typeof apiErrors === "object") {
        if (Array.isArray(apiErrors.password) && apiErrors.password.length > 0) {
          form.setError("password", { message: apiErrors.password[0] })
        }
        if (Array.isArray(apiErrors.confirmPassword) && apiErrors.confirmPassword.length > 0) {
          form.setError("confirmPassword", { message: apiErrors.confirmPassword[0] })
        }
        if (Array.isArray(apiErrors.email) && apiErrors.email.length > 0) {
          form.setError("email", { message: apiErrors.email[0] })
        }
        if (Array.isArray(apiErrors.whatsapp) && apiErrors.whatsapp.length > 0) {
          form.setError("whatsapp", { message: apiErrors.whatsapp[0] })
        }
        if (Array.isArray(apiErrors.nome) && apiErrors.nome.length > 0) {
          form.setError("nome", { message: apiErrors.nome[0] })
        }
        const firstMsg = Object.values(apiErrors).flat().at(0)
        if (firstMsg) {
          setServerError(String(firstMsg))
          toast.error(String(firstMsg))
        }
      } else {
        const message = err?.response?.data?.message || "Ocorreu um erro ao criar sua conta. Tente novamente."
        setServerError(message)
        toast.error(message)
      }
    } finally {
      setFormLoading(false)
    }
  }

  const sendVerificationCode = async () => {
    const email = form.getValues("email")
    const whatsapp = form.getValues("whatsapp")
    
    if (!email || !whatsapp) {
        toast.error("Preencha email e WhatsApp para receber o código.")
        return
    }
    
    setFormLoading(true)
    try {
        await authRepository.sendOtp(email, 'email')
        // await authRepository.sendOtp(whatsapp, 'whatsapp') // Uncomment to send via WhatsApp too if needed
        setVerificationSent(true)
        toast.success(`Código de verificação enviado para ${email}`)
    } catch (error) {
        toast.error("Erro ao enviar código. Tente novamente.")
        console.error(error)
    } finally {
        setFormLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
        toast.error("Código inválido.")
        return
    }

    const email = form.getValues("email")
    setFormLoading(true)
    try {
        const isValid = await authRepository.verifyOtp(email, 'email', code)
        if (isValid) {
            setIsVerified(true)
            toast.success("Contato verificado com sucesso!")
            setStep(3)
        } else {
            toast.error("Código inválido ou expirado.")
        }
    } catch (error) {
        toast.error("Erro ao verificar código.")
        console.error(error)
    } finally {
        setFormLoading(false)
    }
  }

  const goToStep = async (target: 1 | 2 | 3) => {
    if (target <= step) {
      setStep(target)
      return
    }
    if (target === 2) {
      const isValid = await form.trigger(["nome", "email", "whatsapp"])
      if (isValid) {
        setStep(2)
      } else {
        toast.error("Preencha corretamente os dados para avançar.")
      }
      return
    }
    if (target === 3) {
      if (isVerified) {
        setStep(3)
      } else {
        toast.error("Verifique seu contato para avançar.")
      }
    }
  }

  const nextStep = async () => {
    if (step === 1) {
        const isValid = await form.trigger(["nome", "email", "whatsapp"])
        if (isValid) {
            setStep(2)
        }
    } else if (step === 2) {
        if (isVerified) {
            setStep(3)
        } else {
            toast.error("Verifique seu código para continuar.")
        }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Crie sua conta Nexa</CardTitle>
            <Logo width={80} height={80} />
          </div>
          <CardDescription>
            Junte-se à uma comunidade de influencers. Conecte-se com parceiros e grandes marcas. 
          </CardDescription>
        </CardHeader>
        <CardContent>
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
                <button
                  type="button"
                  className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-pink-500" : "bg-gray-200"} cursor-pointer transition-opacity hover:opacity-80`}
                  onClick={() => goToStep(1)}
                  aria-label="Etapa 1"
                  title="Etapa 1"
                />
                <button
                  type="button"
                  className={`h-2 w-2 mx-1 rounded-full ${step >= 2 ? "bg-pink-500" : "bg-gray-200"} cursor-pointer transition-opacity hover:opacity-80`}
                  onClick={() => goToStep(2)}
                  aria-label="Etapa 2"
                  title="Etapa 2"
                />
                <button
                  type="button"
                  className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-pink-500" : "bg-gray-200"} cursor-pointer transition-opacity hover:opacity-80`}
                  onClick={() => goToStep(2)}
                  aria-label="Etapa 2"
                  title="Etapa 2"
                />
                <button
                  type="button"
                  className={`h-2 w-2 mx-1 rounded-full ${step >= 3 ? "bg-pink-500" : "bg-gray-200"} cursor-pointer transition-opacity hover:opacity-80`}
                  onClick={() => goToStep(3)}
                  aria-label="Etapa 3"
                  title="Etapa 3"
                />
                <button
                  type="button"
                  className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-pink-500" : "bg-gray-200"} cursor-pointer transition-opacity hover:opacity-80`}
                  onClick={() => goToStep(3)}
                  aria-label="Etapa 3"
                  title="Etapa 3"
                />
            </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Step 1: Personal Info */}
              <div className={step === 1 ? "space-y-4" : "hidden"}>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <PhoneInput 
                            placeholder="(11) 99999-9999" 
                            {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                    type="button" 
                    className="w-full" 
                    onClick={nextStep}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Step 2: Verification */}
              <div className={step === 2 ? "space-y-4" : "hidden"}>
                 <div className="text-center space-y-2 mb-4">
                    <div className="bg-pink-100 p-3 rounded-full w-fit mx-auto">
                        <Smartphone className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Verifique seu contato</h3>
                    <p className="text-sm text-muted-foreground">
                        Para sua segurança, enviaremos um código para confirmar seus dados.
                    </p>
                 </div>

                 {!verificationSent ? (
                     <div className="space-y-4">
                         <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                             <div className="flex items-center gap-2">
                                 <Mail className="h-4 w-4 text-muted-foreground" />
                                 <span>{form.getValues("email")}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Smartphone className="h-4 w-4 text-muted-foreground" />
                                 <span>{form.getValues("whatsapp")}</span>
                             </div>
                         </div>
                         <Button type="button" onClick={sendVerificationCode} className="w-full" disabled={formLoading}>
                             {formLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enviar Código de Verificação"}
                         </Button>
                         <Button variant="ghost" type="button" onClick={() => setStep(1)} className="w-full">
                             Corrigir dados
                         </Button>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <FormItem>
                             <FormLabel>Código de Verificação (6 dígitos)</FormLabel>
                             <FormControl>
                                 <Input 
                                    placeholder="000000" 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value)} 
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                 />
                             </FormControl>
                         </FormItem>
                         <Button type="button" onClick={verifyCode} className="w-full bg-green-600 hover:bg-green-700" disabled={formLoading}>
                             {formLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verificar Código"}
                         </Button>
                         <Button variant="ghost" type="button" onClick={() => setVerificationSent(false)} className="w-full text-sm">
                             Reenviar código
                         </Button>
                     </div>
                 )}
              </div>

              {/* Step 3: Security & Terms */}
              <div className={step === 3 ? "space-y-4" : "hidden"}>
                 <Button 
                    type="button" 
                    variant="ghost" 
                    className="mb-2 p-0 h-auto hover:bg-transparent"
                    onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center gap-2 mb-4">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Contatos verificados com sucesso</span>
                </div>

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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Aceito os termos e condições
                        </FormLabel>
                        <FormDescription>
                          Você concorda com nossa{" "}
                          <Link
                            href="/privacy-policy"
                            className="underline text-primary hover:text-primary/80"
                          >
                            Política de Privacidade
                          </Link>{" "}
                          e{" "}
                          <Link
                            href="/terms-of-use"
                            className="underline text-primary hover:text-primary/80"
                          >
                            Termos de Uso
                          </Link>
                          .
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {serverError && (
                    <Alert variant="destructive">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{serverError}</AlertDescription>
                    </Alert>
                )}

                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Finalizar Cadastro"
                  )}
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-4 space-y-3">
            <div className="flex items-center w-full gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-sm">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <GoogleOAuthButton role="creator" className="rounded-md" />
            <p className="text-sm text-muted-foreground text-center">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  )
}
