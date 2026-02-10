"use client"

import React, { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Loader2, ArrowRight, Smartphone, Mail } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Checkbox } from "@/presentation/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Alert, AlertDescription } from "@/presentation/components/ui/alert"
import { Logo } from "@/presentation/components/logo"
import { GoogleOAuthButton } from "@/presentation/components/auth/google-oauth-button"
import { useAuth } from "@/presentation/contexts/auth-provider"

import { RegisterBrandUseCase } from "@/application/use-cases/register-brand.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

const authRepository = new ApiAuthRepository(api)
const registerBrandUseCase = new RegisterBrandUseCase(authRepository)

// Schema Validation
const signUpSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
  email: z.email("Email corporativo inválido"),
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

export default function BrandSignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717]">
          Carregando...
        </div>
      }
    >
      <BrandSignUpInner />
    </Suspense>
  )
}

function BrandSignUpInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Verification State
  const [verificationSent, setVerificationSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [code, setCode] = useState("")

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      companyName: "",
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

    setLoading(true)
    setServerError(null)

    try {
      const { companyName, email, whatsapp, password } = data

      const auth = await registerBrandUseCase.execute({
        name: companyName,
        email,
        whatsapp,
        password,
        password_confirmation: password,
      })
      login(auth.token, auth.user)
      toast.success("Conta empresarial criada com sucesso!")
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
        if (Array.isArray(apiErrors.companyName) && apiErrors.companyName.length > 0) {
          form.setError("companyName", { message: apiErrors.companyName[0] })
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
      setLoading(false)
    }
  }

  const sendVerificationCode = async () => {
    const email = form.getValues("email")
    const whatsapp = form.getValues("whatsapp")

    if (!email || !whatsapp) {
      toast.error("Preencha email e WhatsApp para receber o código.")
      return
    }

    setLoading(true)
    try {
      setCode("")
      const devCode = await authRepository.sendOtp(email, 'email')
      setVerificationSent(true)
      if (devCode) {
          toast.success(`Código de verificação enviado: ${devCode}`)
          console.log("DEV CODE:", devCode)
      } else {
          toast.success(`Código de verificação enviado para ${email}`)
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || "Erro ao enviar código. Tente novamente."
      toast.error(message)
      console.error(axiosError)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error("Código inválido.")
      return
    }

    const email = form.getValues("email")
    setLoading(true)
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
      setLoading(false)
    }
  }

  const goToStep = async (target: 1 | 2 | 3) => {
    if (target <= step) {
      setStep(target)
      return
    }
    if (target === 2) {
      const isValid = await form.trigger(["companyName", "email", "whatsapp"])
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
      const isValid = await form.trigger(["companyName", "email", "whatsapp"])
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
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />

      <Card className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="flex items-center justify-between ">
            <CardTitle className="text-xl font-bold tracking-tight">
              Nexa para Marcas
            </CardTitle>
            <Logo width={100} height={100} />
          </div>
          <CardDescription className="mb-1  text-xs text-left text-zinc-600 dark:text-zinc-400 font-medium leading-none">
            Encontre os melhores criadores para suas campanhas.
          </CardDescription>
        </CardHeader>
        <div className="relative">
          {/* Scroll Shadow Indicator - Top */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-white dark:from-zinc-900 to-transparent pointer-events-none z-10 opacity-0 transition-opacity duration-300" id="scroll-shadow-top" />

          {/* Scroll Shadow Indicator - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white dark:from-zinc-900 via-white/80 dark:via-zinc-900/80 to-transparent pointer-events-none z-10 transition-opacity duration-300" id="scroll-shadow-bottom" />

          <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto scroll-smooth" onScroll={(e) => {
            const target = e.currentTarget;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;

            const topShadow = document.getElementById('scroll-shadow-top');
            const bottomShadow = document.getElementById('scroll-shadow-bottom');

            if (topShadow) {
              topShadow.style.opacity = scrollTop > 20 ? '1' : '0';
            }

            if (bottomShadow) {
              bottomShadow.style.opacity = scrollTop < scrollHeight - clientHeight - 20 ? '1' : '0';
            }
          }}>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-5 px-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]" : "bg-zinc-200 dark:bg-white/10"}`}
                  onClick={() => goToStep(s as 1 | 2 | 3)}
                  aria-label={`Etapa ${s}`}
                />
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Step 1: Company Info */}
                <div className={step === 1 ? "space-y-3" : "hidden"}>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sua Marca Ltda"
                            className="text-xs bg-zinc-100/50 dark:bg-white/5 border-2 border-zinc-200 dark:border-white/10 focus-visible:ring-purple-600/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-xl"
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
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Email Corporativo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="contato@empresa.com"
                            type="email"
                            className="text-xs bg-zinc-100/50 dark:bg-white/5 border-2 border-zinc-200 dark:border-white/10 focus-visible:ring-purple-600/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-xl"
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">WhatsApp Comercial</FormLabel>
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 h-11 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={nextStep}
                  >
                    Próxima etapa <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Step 2: Verification */}
                <div className={step === 2 ? "space-y-6" : "hidden"}>
                  <div className="text-center space-y-3 mb-6">
                    <div className="bg-purple-600/10 p-3 rounded-full w-fit mx-auto ring-1 ring-purple-600/20">
                      <Smartphone className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Verifique seu contato</h3>
                      <p className="text-sm text-muted-foreground px-4">
                        Enviamos um código para seu email para garantir a autenticidade da sua marca.
                      </p>
                    </div>
                  </div>

                  {!verificationSent ? (
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-purple-600" />
                          <span className="text-foreground/80">{form.getValues("email")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-purple-600" />
                          <span className="text-foreground/80">{form.getValues("whatsapp")}</span>
                        </div>
                      </div>
                      <Button type="button" onClick={sendVerificationCode} className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 h-11 font-bold rounded-xl transition-all" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enviar Código"}
                      </Button>
                      <Button variant="ghost" type="button" onClick={() => setStep(1)} className="w-full text-muted-foreground hover:text-foreground">
                        Alterar dados de contato
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
                            className="text-center text-3xl tracking-[1em] h-16 bg-background/40 border-purple-600/20 focus-visible:ring-purple-600 font-black pl-[1em]"
                          />
                        </FormControl>
                      </FormItem>
                      <Button type="button" onClick={verifyCode} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 h-11 font-bold rounded-xl transition-all" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Código"}
                      </Button>
                      <div className="text-center">
                        <button type="button" onClick={() => setVerificationSent(false)} className="text-xs text-muted-foreground hover:text-purple-600 transition-colors">
                          Não recebeu o código? Reenviar
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
                    <span className="text-sm font-semibold tracking-tight">Contato verificado</span>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Sua Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="******"
                              className="bg-background/40 border-white/5 focus-visible:ring-purple-600/50"
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
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Confirme a Senha</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="******"
                              className="bg-background/40 border-white/5 focus-visible:ring-purple-600/50"
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
                            className="mt-1 border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs font-medium text-foreground">
                            Aceito os termos e condições
                          </FormLabel>
                          <FormDescription className="text-[10px] leading-tight opacity-70">
                            Ao continuar, você concorda com nossa{" "}
                            <Link href="/privacy-policy" className="underline text-purple-600">Política de Privacidade</Link>
                            {" "}e{" "}
                            <Link href="/terms-of-use" className="underline text-purple-600">Termos de Uso</Link>.
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
                      className="flex-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 h-11 font-bold rounded-xl transition-all transform hover:scale-[1.02]"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Finalizar Cadastro"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            <div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-4 text-muted-foreground/40 font-semibold tracking-widest">ou</span>
                </div>
              </div>

              <GoogleOAuthButton role="brand" className="rounded-xl border-white/5 bg-background/40 hover:bg-background/60 transition-all font-semibold h-11" />

              <div className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-purple-700 dark:text-purple-400 font-bold hover:underline ml-1">
                    Entrar agora
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
