"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, X, ArrowRight, ArrowLeft } from "lucide-react"

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
import { Checkbox } from "@/presentation/components/ui/checkbox"
import { Badge } from "@/presentation/components/ui/badge"
import { TermsModal } from "@/presentation/components/terms/terms-modal"
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content"

const campaignRepository = new ApiCampaignRepository(api)
const applyToCampaignUseCase = new ApplyToCampaignUseCase(campaignRepository)
const termsRepository = new ApiTermsRepository(api)

export const applicationSchema = z.object({
  proposal: z.string().min(20, "A proposta deve ter pelo menos 20 caracteres"),
  budget: z.number().min(1, "O orçamento deve ser maior que zero"),
  delivery_days: z.number().min(1, "O prazo deve ser de pelo menos 1 dia"),
  portfolio_links: z.array(z.string().url("URL inválida")),
})

export type ApplicationFormValues = z.infer<typeof applicationSchema>

interface ApplyButtonProps {
  campaign: Campaign
  onSuccess?: () => void
}

export function ApplyButton({ campaign, onSuccess }: ApplyButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [newLink, setNewLink] = useState("")
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      proposal: "",
      budget: campaign.budget,
      delivery_days: 7,
      portfolio_links: [],
    },
  })

  // Check terms acceptance on mount
  useEffect(() => {
    if (open) {
        termsRepository.check(['creator_application']).then(status => {
            setTermsAccepted(status.creator_application)
        })
    }
  }, [open])

  if (!user || user.role !== "creator") {
    return null
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

  const handleNextStep = async () => {
    const isValid = await form.trigger(["proposal", "budget", "delivery_days"])
    if (isValid) {
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    setStep(1)
  }

  const addLink = () => {
    if (newLink && z.string().url().safeParse(newLink).success) {
      const currentLinks = form.getValues("portfolio_links")
      form.setValue("portfolio_links", [...currentLinks, newLink])
      setNewLink("")
    }
  }

  const removeLink = (index: number) => {
    const currentLinks = form.getValues("portfolio_links")
    form.setValue("portfolio_links", currentLinks.filter((_, i) => i !== index))
  }

  const togglePortfolioLink = (url: string) => {
    const currentLinks = form.getValues("portfolio_links")
    if (currentLinks.includes(url)) {
      form.setValue("portfolio_links", currentLinks.filter(l => l !== url))
    } else {
      form.setValue("portfolio_links", [...currentLinks, url])
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
      if (isOpen && !termsAccepted) {
          setShowTerms(true)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
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
                                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                        <div>
                            <h4 className="text-sm font-medium mb-3">Links do seu Portfólio (Recomendado)</h4>
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
                                                {isSelected && <CheckIcon className="ml-1 h-3 w-3" />}
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

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
