"use client"

import React, { Suspense, useEffect, useState } from "react"
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717]">
          Carregando...
        </div>
      }
    >
      <CreatorSignUpInner />
    </Suspense>
  )
}

function CreatorSignUpInner() {
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
      setCode("")
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Premium Background Blobs */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

      <Card className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo width={100} height={40} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Crie sua conta Nexa
            </CardTitle>
            <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Junte-se à maior comunidade de creators UGC do Brasil.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "bg-zinc-200 dark:bg-white/10"}`}
                onClick={() => goToStep(s as 1 | 2 | 3)}
                aria-label={`Etapa ${s}`}
              />
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Step 1: Personal Info */}
              <div className={step === 1 ? "space-y-6" : "hidden"}>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Seu Melhor Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
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
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">WhatsApp</FormLabel>
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
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25 h-11 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={nextStep}
                >
                  Próxima etapa <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Step 2: Verification */}
              <div className={step === 2 ? "space-y-6" : "hidden"}>
                <div className="text-center space-y-3 mb-6">
                  <div className="bg-pink-500/10 p-3 rounded-full w-fit mx-auto ring-1 ring-pink-500/20">
                    <Smartphone className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Verifique seu contato</h3>
                    <p className="text-sm text-muted-foreground px-4">
                      Enviamos um código de segurança para seu email para confirmar seu cadastro.
                    </p>
                  </div>
                </div>

                {!verificationSent ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-pink-500" />
                        <span className="text-foreground/80">{form.getValues("email")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-pink-500" />
                        <span className="text-foreground/80">{form.getValues("whatsapp")}</span>
                      </div>
                    </div>
                    <Button type="button" onClick={sendVerificationCode} className="w-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25 h-11 font-bold rounded-xl transition-all" disabled={formLoading}>
                      {formLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enviar Código"}
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => setStep(1)} className="w-full text-muted-foreground hover:text-foreground">
                      Corrigir dados de contato
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-center block w-full mb-4">Código de 6 dígitos</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          maxLength={6}
                          className="text-center text-3xl tracking-[1em] h-16 bg-background/40 border-pink-500/20 focus-visible:ring-pink-500 font-black pl-[1em]"
                        />
                      </FormControl>
                    </FormItem>
                    <Button type="button" onClick={verifyCode} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 h-11 font-bold rounded-xl transition-all" disabled={formLoading}>
                      {formLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verificar Código"}
                    </Button>
                    <div className="text-center">
                      <button type="button" onClick={() => setVerificationSent(false)} className="text-xs text-muted-foreground hover:text-pink-600 transition-colors">
                        Reenviar código de segurança
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Security & Terms */}
              <div className={step === 3 ? "space-y-6" : "hidden"}>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                  <div className="bg-emerald-500 rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">Verificação concluída</span>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Senha de Acesso</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            className="bg-background/40 border-white/5 focus-visible:ring-pink-500/50"
                            {...field}
                          />
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            className="bg-background/40 border-white/5 focus-visible:ring-pink-500/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-white/5 p-4 bg-white/5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1 border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-medium text-foreground">
                          Aceito os termos e condições
                        </FormLabel>
                        <FormDescription className="text-[10px] leading-tight opacity-70">
                          Ao criar sua conta, você aceita nossa{" "}
                          <Link href="/privacy-policy" className="underline text-pink-500">Política de Privacidade</Link>
                          {" "}e{" "}
                          <Link href="/terms-of-use" className="underline text-pink-500">Termos de Uso</Link>.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {serverError && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 h-11 border border-white/5 bg-background/20 rounded-xl font-bold"
                    onClick={() => setStep(2)}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-2 bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25 h-11 font-bold rounded-xl transition-all transform hover:scale-[1.02]"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Finalizar Cadastro"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          <div className="mt-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-4 text-muted-foreground/40 font-semibold tracking-widest">ou</span>
              </div>
            </div>

            <GoogleOAuthButton role="creator" className="rounded-xl border-white/5 bg-background/40 hover:bg-background/60 transition-all font-semibold h-11" />

            <div className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem sua conta?{" "}
                <Link href="/login" className="text-pink-500 font-bold hover:underline ml-1">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
