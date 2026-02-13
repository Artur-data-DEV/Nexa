"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import type { FieldErrors, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, X, ArrowRight, ArrowLeft, Check } from "lucide-react"

import { Button } from "@/presentation/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/presentation/components/ui/form"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { ApplyToCampaignUseCase } from "@/application/use-cases/apply-to-campaign.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { ApiTermsRepository } from "@/infrastructure/repositories/terms-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { toast } from "sonner"
import { useAuth } from "@/presentation/contexts/auth-provider"
import type { AxiosError } from "axios"
import { Badge } from "@/presentation/components/ui/badge"
import { TermsModal } from "@/presentation/components/terms/terms-modal"
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content"
import Link from "next/link"

const campaignRepository = new ApiCampaignRepository(api)
const applyToCampaignUseCase = new ApplyToCampaignUseCase(campaignRepository)
const termsRepository = new ApiTermsRepository(api)

export const applicationSchema = z.object({
  proposal: z.string().min(20, "A proposta deve ter pelo menos 20 caracteres"),
  budget: z.coerce.number().min(1, "O orçamento deve ser maior que zero"),
  delivery_days: z.coerce.number().int("O prazo deve ser um número inteiro").min(1, "O prazo deve ser de pelo menos 1 dia"),
  portfolio_links: z.array(z.string().url("URL inválida")).min(1, "Adicione pelo menos um link ao portfólio para se candidatar."),
})

export type ApplicationFormValues = z.infer<typeof applicationSchema>

interface ApplyButtonProps {
  campaign: Campaign
  onSuccess?: () => void
}

export function ApplyButton({ campaign, onSuccess }: ApplyButtonProps) {
  const { user, refreshUser, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [newLink, setNewLink] = useState("")
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormValues>,
    defaultValues: {
      proposal: "",
      budget: campaign.budget,
      delivery_days: 7,
      portfolio_links: [],
    },
  })

  // Check terms acceptance on mount
  useEffect(() => {
    termsRepository.check(['creator_application']).then(status => {
        setTermsAccepted(status.creator_application)
    })
  }, [])

  if (authLoading) {
    return <Button disabled>Carregando...</Button>
  }

  if (!user) {
      return null
  }

  if (user.role !== "creator" && user.role !== "student") {
      return null
  }

  // Check permissions based on role
  if (user.role === "creator" && !user.has_premium) {
    return (
      <Button size="lg" variant="outline" className="w-full md:w-auto" asChild>
        <Link href="/dashboard/subscription">Assinar Premium</Link>
      </Button>
    )
  }

  if (user.role === "student" && !user.student_verified) {
      return (
          <Button size="lg" variant="outline" className="w-full md:w-auto" disabled title="Verifique sua conta de estudante para se candidatar">
              Verifique sua conta
          </Button>
      )
  }

  const userPortfolioLinks = user.portfolio?.project_links || []

  const onSubmit = async (data: ApplicationFormValues) => {
    setLoading(true)
    setError(null)
    try {
      await applyToCampaignUseCase.execute(campaign.id, data)
      toast.success("Aplicação enviada com sucesso!")
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
        console.error(err)
        const axiosError = err as AxiosError<{ message?: string; error?: string }>
        setError(
          axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            axiosError.message ||
            "Falha ao enviar aplicação."
        )
    } finally {
      setLoading(false)
    }
  }

  const onInvalid = (errors: FieldErrors<ApplicationFormValues>) => {
        console.log("Form errors:", errors)
        if (errors.portfolio_links) {
            if (Array.isArray(errors.portfolio_links)) {
                 toast.error("Alguns links do portfólio são inválidos.")
            } else {
                 toast.error(errors.portfolio_links.message || "Adicione pelo menos um link ao seu portfólio.")
            }
        } else {
            toast.error("Verifique os campos do formulário.")
        }
    }

    const handleNextStep = async () => {
    const isValid = await form.trigger(["proposal", "budget", "delivery_days"])
    if (isValid) {
      setStep(2)
    } else {
        const errors = form.formState.errors;
        if (errors.proposal) toast.error(errors.proposal.message);
        else if (errors.budget) toast.error(errors.budget.message);
        else if (errors.delivery_days) toast.error(errors.delivery_days.message);
        else toast.error("Por favor, preencha os campos obrigatórios corretamente.");
    }
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  const addLink = () => {
    const result = z.string().url().safeParse(newLink)
    if (newLink && result.success) {
      const currentLinks = form.getValues("portfolio_links")
      form.setValue("portfolio_links", [...currentLinks, newLink], { shouldValidate: true })
      setNewLink("")
    } else if (newLink) {
        toast.error("URL inválida. Certifique-se de incluir http:// ou https://")
    }
  }

  const removeLink = (index: number) => {
    const currentLinks = form.getValues("portfolio_links")
    form.setValue("portfolio_links", currentLinks.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const togglePortfolioLink = (url: string) => {
    const currentLinks = form.getValues("portfolio_links")
    if (currentLinks.includes(url)) {
      form.setValue("portfolio_links", currentLinks.filter(l => l !== url), { shouldValidate: true })
    } else {
      form.setValue("portfolio_links", [...currentLinks, url], { shouldValidate: true })
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
      if (isOpen) {
          refreshUser() // Always refresh user data when opening the application dialog
          if (!termsAccepted) {
              setShowTerms(true)
          } else {
              setOpen(true)
          }
      } else {
          setOpen(isOpen)
          if (!isOpen) setStep(1)
      }
  }

  const handleTermsAccept = async () => {
      await termsRepository.accept('creator_application')
      setTermsAccepted(true)
      setShowTerms(false)
      setOpen(true)
  }

  if (campaign.has_applied) {
      return (
          <Button size="lg" variant="secondary" className="w-full md:w-auto" disabled>
              Inscrito
          </Button>
      )
  }

  return (
    <>
        <TermsModal 
            open={showTerms} 
            onOpenChange={setShowTerms}
            title={TERMS_CONTENT.creator_application.title}
            content={TERMS_CONTENT.creator_application.content}
            onAccept={handleTermsAccept}
        />

        <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
            Candidatar-se à Campanha
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-150">
            <DialogHeader>
            <DialogTitle>Nova Proposta - Passo {step} de 2</DialogTitle>
            <DialogDescription>
                Envie sua proposta para {campaign.brand?.name}.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form 
                onSubmit={(e) => {
                    if (step === 1) {
                        e.preventDefault()
                        handleNextStep()
                    } else {
                        form.handleSubmit(onSubmit, onInvalid)(e)
                    }
                }} 
                className="space-y-4"
            >
                
                {step === 1 && (
                    <>
                        <FormField
                        control={form.control}
                        name="proposal"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sua Proposta</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Descreva como você pretende divulgar o produto, sua experiência relevante e como pode ajudar a marca..." 
                                    className="resize-none h-32"
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                Explique por que você é o criador ideal para esta campanha.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Valor da Proposta (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00"
                                        {...field} 
                                        onChange={(e) => {
                                            const val = e.target.value.replace(',', '.');
                                            field.onChange(val);
                                        }} 
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="delivery_days"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Prazo de Entrega (Dias)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="7"
                                        {...field} 
                                        onChange={(e) => field.onChange(e.target.value)} 
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                            <strong>Aviso:</strong> Você deve selecionar pelo menos um link do seu portfólio para enviar a proposta.
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-3">Links do seu Portfólio (Obrigatório)</h4>
                            {userPortfolioLinks.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {userPortfolioLinks.map((link, i) => {
                                        const isSelected = form.watch("portfolio_links").includes(link.url)
                                        return (
                                            <Badge 
                                                key={i} 
                                                variant={isSelected ? "default" : "outline"}
                                                className="cursor-pointer hover:bg-primary/90 transition-colors py-1 px-3"
                                                onClick={() => togglePortfolioLink(link.url)}
                                            >
                                                {link.title || link.url}
                                                {isSelected && <Check className="ml-1 h-3 w-3" />}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhum link cadastrado no seu perfil.</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Adicionar outro link</h4>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="https://..." 
                                    value={newLink} 
                                    onChange={(e) => setNewLink(e.target.value)}
                                />
                                <Button type="button" variant="secondary" onClick={addLink} size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {form.formState.errors.portfolio_links && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.portfolio_links.message}
                                </p>
                            )}
                            <div className="space-y-2">
                                {form.watch("portfolio_links").map((link, index) => (
                                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
                                        <span className="truncate max-w-[90%]">{link}</span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6" 
                                            onClick={() => removeLink(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step === 2 ? (
                        <Button type="button" variant="outline" onClick={handlePrevStep}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                    ) : <div />}
                    
                    {step === 1 ? (
                        <Button type="button" onClick={handleNextStep}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Proposta
                        </Button>
                    )}
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    </>
  )
}
