"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Button } from "@/presentation/components/ui/button"
import { Card } from "@/presentation/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { UploadCloud, X, PlusCircle, ArrowRight, ArrowLeft, Check, Play, List, Image as ImageIcon, Filter, DollarSign, Calendar, Wand2, FileText, Stars, User } from "lucide-react"
import { ptBR } from "date-fns/locale"
import { CreateCampaignUseCase } from "@/application/use-cases/create-campaign.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { ApiTermsRepository } from "@/infrastructure/repositories/terms-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import NICHES from "@/lib/niches"
import Image from "next/image"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { TermsModal } from "@/presentation/components/terms/terms-modal"
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content"
import { ApiBrandProfileRepository } from "@/infrastructure/repositories/brand-profile-repository"
import Link from "next/link"

if (typeof registerLocale === "function") {
  registerLocale("pt-BR", ptBR)
}

const campaignRepository = new ApiCampaignRepository(api)
const createCampaignUseCase = new CreateCampaignUseCase(campaignRepository)
const termsRepository = new ApiTermsRepository(api)
const brandProfileRepository = new ApiBrandProfileRepository(api)

const BRAZILIAN_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
]

const CAMPAIGN_TYPES = NICHES

const STEPS = [
    { id: 1, label: "Início", icon: Play },
    { id: 2, label: "Nome & Tipo", icon: List },
    { id: 3, label: "Branding", icon: ImageIcon },
    { id: 4, label: "Restrições", icon: Filter },
    { id: 5, label: "Valores", icon: DollarSign },
    { id: 6, label: "Datas", icon: Calendar },
    { id: 7, label: "Revisar", icon: FileText },
]

import { useAuth } from "@/presentation/contexts/auth-provider"

export default function CreateCampaignPage() {
  const { user } = useAuth()
  
  // Profile State
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [profileComplete, setProfileComplete] = useState(true)

  // Terms State
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [checkingTerms, setCheckingTerms] = useState(true)

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1)

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [objective, setObjective] = useState("") // New field to match UI
  const [budget, setBudget] = useState("")
  const [remunerationType, setRemunerationType] = useState<'paga' | 'permuta'>('paga')
  const [deadline, setDeadline] = useState<Date | undefined>()
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [campaignType, setCampaignType] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Filter State
  const [minAge, setMinAge] = useState<number | undefined>()
  const [maxAge, setMaxAge] = useState<number | undefined>()
  const [targetGenders, setTargetGenders] = useState<string[]>([])
  const [targetCreatorTypes, setTargetCreatorTypes] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  // Check Profile on Mount
  useEffect(() => {
      const checkProfile = async () => {
          if (!user || user.role !== 'brand') {
              setCheckingProfile(false)
              return
          }
          try {
              const profile = await brandProfileRepository.getProfile()
              // Check required fields: company_name, description (sobre), niche, address
              // You can add more like 'cnpj' if available in the model
              const requiredFields = ['company_name', 'description', 'niche', 'address']
              // @ts-ignore
              const isComplete = requiredFields.every(field => !!profile[field])
              
              setProfileComplete(isComplete)
          } catch (e) {
              console.error("Error checking profile", e)
          } finally {
              setCheckingProfile(false)
          }
      }
      checkProfile()
  }, [user])

  // Check Terms on Mount
  useEffect(() => {
      const checkTerms = async () => {
          if (!user || user.role !== 'brand') {
              setCheckingTerms(false)
              return
          }
          try {
              const status = await termsRepository.check(['brand_campaign_creation'])
              if (!status.brand_campaign_creation) {
                  setShowTerms(true)
              } else {
                  setTermsAccepted(true)
              }
          } catch (e) {
              console.error(e)
          } finally {
              setCheckingTerms(false)
          }
      }
      checkTerms()
  }, [user])

  const handleTermsAccept = async () => {
      await termsRepository.accept('brand_campaign_creation')
      setTermsAccepted(true)
      setShowTerms(false)
  }

  const resetForm = useCallback(() => {
    setTitle("")
    setDescription("")
    setObjective("")
    setBudget("")
    setRemunerationType('paga')
    setDeadline(undefined)
    setSelectedStates([])
    setFile(null)
    setImagePreview(null)
    setCampaignType("")
    setAttachments([])
    setMinAge(undefined)
    setMaxAge(undefined)
    setTargetGenders([])
    setTargetCreatorTypes([])
    setCurrentStep(1)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.type.startsWith("image")) {
        toast.error("Apenas arquivos de imagem são permitidos.")
        return
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máx: 10MB")
        return
      }
      setFile(f)
      setImagePreview(URL.createObjectURL(f))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      if (!f.type.startsWith("image")) {
        toast.error("Apenas arquivos de imagem são permitidos.")
        return
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máx: 10MB")
        return
      }
      setFile(f)
      setImagePreview(URL.createObjectURL(f))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeState = (state: string) => {
    setSelectedStates((prev) => prev.filter((s) => s.toLowerCase() !== state.toLowerCase()))
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value
    if (selectedState && !selectedStates.includes(selectedState)) {
      setSelectedStates(prev => [...prev, selectedState])
    }
  }

  const handleSelectAllStatesCheckbox = (checked: boolean) => {
    if (checked) {
      setSelectedStates([...BRAZILIAN_STATES])
    } else {
      setSelectedStates([])
    }
  }

  const getSelectAllCheckboxState = () => {
    if (selectedStates.length === 0) {
      return { checked: false, indeterminate: false }
    } else if (selectedStates.length === BRAZILIAN_STATES.length) {
      return { checked: true, indeterminate: false }
    } else {
      return { checked: false, indeterminate: true }
    }
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
      switch (step) {
          case 1: // Início
              if (!description.trim()) { toast.error("Descrição do produto é obrigatória."); return false }
              return true
          case 2: // Nome & Tipo
              if (!title.trim()) { toast.error("Título da campanha é obrigatório."); return false }
              if (!campaignType) { toast.error("Tipo de campanha é obrigatório."); return false }
              return true
          case 3: // Branding
              // Image is optional but recommended
              return true
          case 4: // Restrições
              if (targetCreatorTypes.length === 0) { toast.error("Selecione pelo menos um tipo de criador."); return false }
              if (minAge && maxAge && minAge > maxAge) { toast.error("Idade mínima não pode ser maior que idade máxima."); return false }
              if (minAge && minAge < 18) { toast.error("Idade mínima deve ser pelo menos 18 anos."); return false }
              if (maxAge && maxAge < 18) { toast.error("Idade máxima deve ser pelo menos 18 anos."); return false }
              if (selectedStates.length === 0) { toast.error("Selecione pelo menos um estado."); return false }
              return true
          case 5: // Valores
              if (remunerationType === 'paga' && !budget.trim()) { toast.error("Orçamento é obrigatório para campanhas pagas."); return false }
              return true
          case 6: // Datas
              if (!deadline) { toast.error("Prazo final é obrigatório."); return false }
              return true
          default:
              return true
      }
  }

  const nextStep = () => {
      if (validateStep(currentStep)) {
          setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
      }
  }

  const prevStep = () => {
      setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsCreating(true)

    try {
      const formData = new FormData()
      formData.append("title", title.trim())
      // Combine objective and description if needed, or just use description
      const fullDescription = objective ? `${description}\n\nObjetivo: ${objective}` : description
      formData.append("description", fullDescription.trim())

      if (remunerationType === "paga") {
        const budgetValue = parseFloat(budget)
        if (isNaN(budgetValue) || budgetValue <= 0) {
          toast.error("Orçamento deve ser um número válido e positivo para campanhas pagas.")
          setIsCreating(false)
          return
        }
        formData.append("budget", budgetValue.toString())
      } else {
        const trimmedBudget = budget.trim()
        if (trimmedBudget) {
          const budgetValue = parseFloat(trimmedBudget)
          if (!isNaN(budgetValue) && budgetValue >= 0) {
            formData.append("budget", budgetValue.toString())
          } else {
            formData.append("budget", "0")
          }
        } else {
          formData.append("budget", "0")
        }
      }

      formData.append("remuneration_type", remunerationType)

      const year = deadline!.getFullYear()
      const month = String(deadline!.getMonth() + 1).padStart(2, "0")
      const day = String(deadline!.getDate()).padStart(2, "0")
      formData.append("deadline", `${year}-${month}-${day}`)

      selectedStates.forEach(state => formData.append("target_states[]", state))

      if (campaignType.trim()) {
        formData.append("campaign_type", campaignType.trim())
        formData.append("category", campaignType.trim())
      }

      if (minAge !== undefined) formData.append("min_age", minAge.toString())
      if (maxAge !== undefined) formData.append("max_age", maxAge.toString())

      targetGenders.forEach(gender => formData.append("target_genders[]", gender))
      targetCreatorTypes.forEach(type => formData.append("target_creator_types[]", type))

      if (file) formData.append("image", file)

      attachments.forEach(att => {
        formData.append("attach_file[]", att)
      })

      await createCampaignUseCase.execute(formData)

      setIsSubmitted(true)
      toast.success("Campanha criada com sucesso! Aguarde a aprovação do administrador.")
      resetForm()
      setTimeout(() => setIsSubmitted(false), 5000)

    } catch (err) {
      console.error(err)
      toast.error("Erro inesperado ao criar campanha.")
    } finally {
      setIsCreating(false)
    }
  }

  if (checkingTerms || checkingProfile) {
      return <div className="min-h-[92vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!profileComplete) {
      return (
        <div className="min-h-[92vh] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
            <Card className="w-full max-w-md p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Perfil Incompleto</h2>
                <p className="text-muted-foreground mb-6">
                    Para criar uma campanha, você precisa preencher as informações da sua empresa (Sobre, Nicho, Endereço).
                    Isso ajuda os criadores a conhecerem melhor sua marca.
                </p>
                <Link href="/dashboard/profile">
                    <Button className="w-full">
                        Completar Perfil
                    </Button>
                </Link>
            </Card>
        </div>
      )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-[92vh] flex flex-col items-center justify-center py-4 px-2 sm:px-10">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Campanha Criada!</h2>
          <p className="text-muted-foreground mb-4">
            Sua campanha foi enviada para aprovação. Você receberá uma notificação quando ela for aprovada pelo administrador.
          </p>
          <Button onClick={() => setIsSubmitted(false)} className="bg-pink-500 hover:bg-pink-600 text-white">
            Criar Nova Campanha
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
    <TermsModal 
        open={showTerms}
        onOpenChange={(v) => { if (!termsAccepted) setShowTerms(v) }} // Force accept
        title={TERMS_CONTENT.brand_campaign_creation.title}
        content={TERMS_CONTENT.brand_campaign_creation.content}
        onAccept={handleTermsAccept}
        onReject={() => { window.history.back() }} // Go back if rejected
    />

    <div className="min-h-[92vh] flex flex-col items-center py-4 px-2 sm:px-10">
      <div className="w-full max-w-5xl">
        <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold ml-2">Criar campanha</h1>
        </div>

        {/* Stepper Header */}
        <div className="bg-background rounded-lg border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">Passo {currentStep} de {STEPS.length}</span>
                <span className="text-sm text-muted-foreground font-medium">
                    Tempo estimado: {Math.max(1, 8 - currentStep)} min
                </span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-8">
                <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
            </div>
            
            <div className="flex justify-between relative">
                {STEPS.map((step, index) => {
                    const isActive = step.id === currentStep
                    const isCompleted = step.id < currentStep
                    const Icon = step.icon

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 group">
                            <div 
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 bg-background",
                                    isActive ? "border-primary text-primary" : 
                                    isCompleted ? "border-primary bg-primary text-primary-foreground" : 
                                    "border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                "text-xs mt-2 font-medium hidden sm:block",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
                {/* Connecting lines could be added here if needed, but the progress bar serves this purpose */}
            </div>
        </div>

        {/* Form Content */}
        <div className="rounded-2xl border bg-background shadow-sm p-4 md:p-8 w-full min-h-100">
            
            {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Vamos começar!</h2>
                        <p className="text-muted-foreground">2 minutinhos e nossa IA fará seu briefing!</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Descreva o produto/serviço a ser divulgado? *</label>
                        <Input 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Cosméticos facial especializado em acne; O omega3; Toalha mágica para secar rápido"
                            className="bg-muted/30"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">*Não cite sua marca. Apenas o produto.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Qual o objetivo desta campanha?</label>
                        <Textarea 
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Ex: Aumentar reconhecimento de marca, Gerar vendas, Criar conteúdo UGC..."
                            className="bg-muted/30 min-h-30"
                        />
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Identificação</h2>
                        <p className="text-muted-foreground mb-6">Dê um nome e categoria para sua campanha.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Título da Campanha *</label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Campanha Verão 2026"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Campanha *</label>
                        <select
                            value={campaignType}
                            onChange={e => setCampaignType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        >
                            <option value="">Selecione o tipo</option>
                            {CAMPAIGN_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Visual</h2>
                        <p className="text-muted-foreground mb-6">Adicione imagens e anexos para inspirar os criadores.</p>
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2">Logo/Capa da Campanha</label>
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background min-h-32",
                                dragActive && "border-primary bg-primary/10"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clique para fazer upload ou arraste o arquivo</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        {imagePreview && (
                            <div className="flex flex-col items-center mt-4 bg-muted p-4 rounded-lg">
                                <div className="relative w-full max-w-50 h-40">
                                    <Image
                                        src={imagePreview}
                                        alt="Logo Preview"
                                        fill
                                        className="rounded-lg object-contain"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="mt-2"
                                    onClick={() => { setFile(null); setImagePreview(null); }}
                                >
                                    Remover
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2">Anexos (PDF, DOC, Imagens)</label>
                        <div
                            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background min-h-24"
                            onClick={() => attachmentInputRef.current?.click()}
                        >
                            <PlusCircle className="w-8 h-8 mb-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Adicionar arquivos complementares</span>
                            <input
                                ref={attachmentInputRef}
                                type="file"
                                multiple
                                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                onChange={handleAttachmentChange}
                            />
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-background rounded flex items-center justify-center border">
                                                <span className="text-xs font-medium">
                                                    {attachment.name.split('.').pop()?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-50">{attachment.name}</p>
                                                <p className="text-xs text-muted-foreground">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeAttachment(index)}
                                            className="p-1 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Segmentação</h2>
                        <p className="text-muted-foreground mb-6">Defina quem pode participar da sua campanha.</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-3">Tipo de Criador *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['ugc', 'influencer', 'both'].map(type => {
                                const isChecked = targetCreatorTypes.includes(type)
                                return (
                                    <label key={type} className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                                        isChecked ? "border-primary bg-primary/5" : "border-muted"
                                    )}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setTargetCreatorTypes(prev => [...prev, type]);
                                                } else {
                                                    setTargetCreatorTypes(prev => prev.filter(t => t !== type));
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border flex items-center justify-center mb-2",
                                            isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                                        )}>
                                            {isChecked && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm font-medium capitalize">
                                            {type === 'ugc' ? 'UGC' :
                                            type === 'influencer' ? 'Influenciador' :
                                                'Ambos'}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Idade Mínima</label>
                            <Input
                                type="number"
                                min="18"
                                max="100"
                                value={minAge || ''}
                                onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="18"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Idade Máxima</label>
                            <Input
                                type="number"
                                min="18"
                                max="100"
                                value={maxAge || ''}
                                onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">Gênero</label>
                        <div className="flex gap-4">
                            {['male', 'female', 'other'].map(gender => (
                                <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={targetGenders.includes(gender)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTargetGenders(prev => [...prev, gender]);
                                            } else {
                                                setTargetGenders(prev => prev.filter(g => g !== gender));
                                            }
                                        }}
                                        className="rounded border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm capitalize">
                                        {gender === 'male' ? 'Masculino' :
                                            gender === 'female' ? 'Feminino' :
                                            'Outro'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Estados *</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStates.map(state => (
                                <span
                                    key={state}
                                    className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium gap-1"
                                >
                                    {state}
                                    <button
                                        type="button"
                                        className="ml-1 hover:text-destructive"
                                        onClick={() => removeState(state)}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    ref={(el) => {
                                        if (el) {
                                            const state = getSelectAllCheckboxState();
                                            el.checked = state.checked;
                                            el.indeterminate = state.indeterminate;
                                        }
                                    }}
                                    onChange={(e) => handleSelectAllStatesCheckbox(e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary"
                                />
                                <span className="text-sm">Selecionar todos os estados</span>
                            </label>
                        </div>
                        <select
                            value=""
                            onChange={handleStateChange}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        >
                            <option value="">Selecione um estado para adicionar</option>
                            {BRAZILIAN_STATES.filter(state => !selectedStates.includes(state)).map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Investimento</h2>
                        <p className="text-muted-foreground mb-6">Defina como os criadores serão recompensados.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Remuneração *</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div 
                                onClick={() => setRemunerationType('paga')}
                                className={cn(
                                    "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                                    remunerationType === 'paga' ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                )}
                            >
                                <h3 className="font-medium mb-1">Paga (Dinheiro)</h3>
                                <p className="text-xs text-muted-foreground">Pagamento em valor monetário via plataforma.</p>
                            </div>
                            <div 
                                onClick={() => setRemunerationType('permuta')}
                                className={cn(
                                    "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                                    remunerationType === 'permuta' ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                )}
                            >
                                <h3 className="font-medium mb-1">Permuta</h3>
                                <p className="text-xs text-muted-foreground">Troca por produtos ou serviços.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {remunerationType === 'permuta' ? 'Valor Estimado (R$) - Opcional' : 'Orçamento Total (R$) *'}
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                value={budget}
                                onChange={e => setBudget(e.target.value)}
                                placeholder={remunerationType === 'permuta' ? '0,00' : '800,00'}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Cronograma</h2>
                        <p className="text-muted-foreground mb-6">Defina os prazos importantes da campanha.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Prazo para Inscrições *</label>
                        <div className="w-full relative">
                            <DatePicker
                                selected={deadline}
                                onChange={(date: Date | null) => setDeadline(date || undefined)}
                                locale="pt-BR"
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                customInput={<Input className="w-full" />}
                                placeholderText="Selecione uma data"
                            />
                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Até esta data, os criadores poderão enviar propostas.
                        </p>
                    </div>
                </div>
            )}

            {currentStep === 7 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Revisão</h2>
                        <p className="text-muted-foreground mb-6">Confira todos os detalhes antes de publicar.</p>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-6 space-y-4 border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Campanha</h3>
                                <p className="font-semibold text-lg">{title}</p>
                                <p className="text-sm">{campaignType}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Investimento</h3>
                                <p className="font-semibold text-lg">
                                    {remunerationType === 'paga' 
                                        ? `R$ ${parseFloat(budget || '0').toFixed(2)}` 
                                        : 'Permuta'}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                                <p className="text-sm whitespace-pre-wrap">{description}</p>
                                {objective && (
                                    <div className="mt-2">
                                        <h4 className="text-xs font-semibold uppercase">Objetivo</h4>
                                        <p className="text-sm">{objective}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Público Alvo</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {targetCreatorTypes.map(t => (
                                        <span key={t} className="text-xs bg-secondary px-2 py-1 rounded capitalize">{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Locais</h3>
                                <p className="text-sm">{selectedStates.length} estados selecionados</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                        <Wand2 className="h-5 w-5 shrink-0" />
                        <p>Novo recurso em breve: Nossa IA analisará sua campanha e gerará um briefing detalhado para os criadores aprovados.</p>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isCreating}
                    className={cn(currentStep === 1 && "invisible")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>

                {currentStep < STEPS.length ? (
                    <Button onClick={nextStep} className="bg-primary">
                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isCreating}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-37.5"
                    >
                        {isCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        Publicar Campanha
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
    </>
  )
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
