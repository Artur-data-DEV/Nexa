"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/presentation/components/ui/form"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { ApplyToCampaignUseCase } from "@/application/use-cases/apply-to-campaign.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import { Campaign } from "@/domain/entities/campaign"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { toast } from "sonner"
import { useAuth } from "@/presentation/contexts/auth-provider"

const campaignRepository = new ApiCampaignRepository(api)
const applyToCampaignUseCase = new ApplyToCampaignUseCase(campaignRepository)

export const applicationSchema = z.object({
  proposal: z.string().min(20, "A proposta deve ter pelo menos 20 caracteres"),
  budget: z.number().min(1, "O orçamento deve ser maior que zero"),
  delivery_days: z.number().min(1, "O prazo deve ser de pelo menos 1 dia"),
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

  if (!user || user.role !== "creator") {
    return null
  }

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      proposal: "",
      budget: campaign.budget,
      delivery_days: 7,
    },
  })

  const onSubmit = async (data: ApplicationFormValues) => {
    setLoading(true)
    setError(null)
    try {
      await applyToCampaignUseCase.execute(campaign.id, data)
      toast.success("Aplicação enviada com sucesso!")
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || "Falha ao enviar aplicação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          Candidatar-se à Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
          <DialogDescription>
            Envie sua proposta para {campaign.brand?.name}. Seja claro e objetivo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="proposal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua Proposta</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Descreva como você pretende divulgar o produto..." 
                        className="resize-none h-32"
                        {...field} 
                    />
                  </FormControl>
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
                    <FormLabel>Valor (R$)</FormLabel>
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
                    <FormLabel>Prazo (Dias)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Proposta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
