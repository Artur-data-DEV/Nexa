"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Loader2, ArrowRight, ArrowLeft, Smartphone, Mail, Building2 } from "lucide-react"
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

import { RegisterBrandUseCase } from "@/application/use-cases/register-brand.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

const authRepository = new ApiAuthRepository(api)
const registerBrandUseCase = new RegisterBrandUseCase(authRepository)

// Schema Validation
const signUpSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email corporativo inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
  verificationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

export default function BrandSignUpPage() {
  const router = useRouter()
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
      
      await registerBrandUseCase.execute({
        name: companyName,
        email,
        whatsapp,
        password,
        password_confirmation: password,
      })
      
      toast.success("Conta empresarial criada com sucesso!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      const message = error.response?.data?.message || "Ocorreu um erro ao criar sua conta. Tente novamente."
      setServerError(message)
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
        await authRepository.sendOtp(email, 'email')
        setVerificationSent(true)
        toast.success(`Código de verificação enviado para ${email}`)
    } catch (error) {
        toast.error("Erro ao enviar código. Tente novamente.")
        console.error(error)
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
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Nexa para Marcas
            </CardTitle>
            <Logo width={80} height={80} />
          </div>
          <CardDescription>
            Encontre os melhores criadores para suas campanhas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-purple-600" : "bg-gray-200"}`} />
                <div className={`h-2 w-2 mx-1 rounded-full ${step >= 2 ? "bg-purple-600" : "bg-gray-200"}`} />
                <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-purple-600" : "bg-gray-200"}`} />
                <div className={`h-2 w-2 mx-1 rounded-full ${step >= 3 ? "bg-purple-600" : "bg-gray-200"}`} />
                <div className={`h-2 flex-1 rounded-full ${step >= 3 ? "bg-purple-600" : "bg-gray-200"}`} />
            </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Step 1: Company Info */}
              <div className={step === 1 ? "space-y-4" : "hidden"}>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua Marca Ltda" {...field} />
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
                      <FormLabel>Email Corporativo</FormLabel>
                      <FormControl>
                        <Input placeholder="contato@empresa.com" type="email" {...field} />
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
                      <FormLabel>WhatsApp Comercial</FormLabel>
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
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    onClick={nextStep}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Step 2: Verification */}
              <div className={step === 2 ? "space-y-4" : "hidden"}>
                 <div className="text-center space-y-2 mb-4">
                    <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto">
                        <Smartphone className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Verifique seu contato</h3>
                    <p className="text-sm text-muted-foreground">
                        Para garantir a segurança da plataforma, validamos todas as marcas.
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
                         <Button type="button" onClick={sendVerificationCode} className="w-full" disabled={loading}>
                             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Enviar Código de Verificação"}
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
                         <Button type="button" onClick={verifyCode} className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verificar Código"}
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
                    <span className="text-sm font-medium">Empresa verificada com sucesso</span>
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
                          Você concorda com nossa Política de Privacidade e Termos de Uso.
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

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? (
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
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-purple-600 hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
