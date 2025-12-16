"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Loader2, ArrowRight, ArrowLeft } from "lucide-react"

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

// Schema Validation
const signUpSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

import { RegisterCreatorUseCase } from "@/application/use-cases/register-creator.use-case"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

const authRepository = new ApiAuthRepository(api)
const registerCreatorUseCase = new RegisterCreatorUseCase(authRepository)

export default function CreatorSignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      nome: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange",
  })

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true)
    setServerError(null)

    try {
      const { nome, email, whatsapp, password } = data
      
      await registerCreatorUseCase.execute({
        name: nome,
        email,
        whatsapp,
        password,
        password_confirmation: password, // Laravel expectation
      })
      
      // Redirect on success
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      const message = error.response?.data?.message || "Ocorreu um erro ao criar sua conta. Tente novamente."
      setServerError(message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async () => {
    const isValid = await form.trigger(["nome", "email", "whatsapp"])
    if (isValid) {
      setStep(2)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crie sua conta Nexa</CardTitle>
          <CardDescription>
            Junte-se à comunidade de criadores e conecte-se com grandes marcas.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                            onCountryChange={(c) => console.log(c)}
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

              {/* Step 2: Security & Terms */}
              <div className={step === 2 ? "space-y-4" : "hidden"}>
                 <Button 
                    type="button" 
                    variant="ghost" 
                    className="mb-2 p-0 h-auto hover:bg-transparent"
                    onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

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

                <Button type="submit" className="w-full" disabled={loading}>
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
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
