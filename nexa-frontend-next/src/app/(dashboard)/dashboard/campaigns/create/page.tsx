"use client"

import React, { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Button } from "@/presentation/components/ui/button"
import { Card } from "@/presentation/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/presentation/components/ui/popover"
import { Calendar } from "@/presentation/components/ui/calendar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, UploadCloud, X, PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreateCampaignUseCase } from "@/application/use-cases/create-campaign.use-case"
import { ApiCampaignRepository } from "@/infrastructure/repositories/campaign-repository"
import { api } from "@/infrastructure/api/axios-adapter"
import NICHES from "@/lib/niches"
import Image from "next/image"

const campaignRepository = new ApiCampaignRepository(api)
const createCampaignUseCase = new CreateCampaignUseCase(campaignRepository)

const BRAZILIAN_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
]

const CAMPAIGN_TYPES = NICHES

export default function CreateCampaignPage() {
  const router = useRouter()
  
  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
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

  const resetForm = useCallback(() => {
    setTitle("")
    setDescription("")
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

  const validateForm = (): boolean => {
    if (!title.trim()) { toast.error("Título da campanha é obrigatório."); return false }
    if (!description.trim()) { toast.error("Descrição da campanha é obrigatória."); return false }
    if (remunerationType === 'paga' && !budget.trim()) { toast.error("Orçamento é obrigatório para campanhas pagas."); return false }
    if (!deadline) { toast.error("Prazo final é obrigatório."); return false }
    if (selectedStates.length === 0) { toast.error("Selecione pelo menos um estado."); return false }
    if (!campaignType) { toast.error("Tipo de campanha é obrigatório."); return false }
    if (targetCreatorTypes.length === 0) { toast.error("Selecione pelo menos um tipo de criador."); return false }
    if (minAge && maxAge && minAge > maxAge) { toast.error("Idade mínima não pode ser maior que idade máxima."); return false }
    if (minAge && minAge < 18) { toast.error("Idade mínima deve ser pelo menos 18 anos."); return false }
    if (maxAge && maxAge < 18) { toast.error("Idade máxima deve ser pelo menos 18 anos."); return false }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsCreating(true)

    try {
        const formData = new FormData()
        formData.append("title", title.trim())
        formData.append("description", description.trim())

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

        if (file) formData.append("logo", file)

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
    <div className="min-h-[92vh] flex flex-col items-center py-4 px-2 sm:px-10">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl" autoComplete="off">
        <div className="rounded-2xl border bg-background shadow-sm p-4 md:p-8 w-full">
           <h2 className="font-bold text-lg md:text-xl mb-6">Criar Nova Campanha</h2>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Título da Campanha *</label>
             <Input
               value={title}
               onChange={e => setTitle(e.target.value)}
               placeholder="Campanha Verão 2024"
               required
             />
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição da Campanha *</label>
             <Textarea
               value={description}
               onChange={e => setDescription(e.target.value)}
               placeholder="Queremos conteúdo autêntico sobre moda verão"
               className="min-h-[90px]"
               required
             />
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Remuneração *</label>
             <select
               value={remunerationType}
               onChange={e => setRemunerationType(e.target.value as 'paga' | 'permuta')}
               className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
               required
             >
               <option value="paga">Paga (Dinheiro)</option>
               <option value="permuta">Permuta (Troca por produtos/serviços)</option>
             </select>
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">
               {remunerationType === 'permuta' ? 'Valor Estimado (R$) - Opcional' : 'Orçamento (R$) *'}
             </label>
             <Input
               type="number"
               value={budget}
               onChange={e => setBudget(e.target.value)}
               placeholder={remunerationType === 'permuta' ? 'R$ 0,00 (opcional)' : 'R$ 800,00'}
               disabled={remunerationType === 'permuta'}
               required={remunerationType !== 'permuta'}
               className={remunerationType === 'permuta' ? 'opacity-50 cursor-not-allowed bg-muted' : ''}
             />
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Campanha *</label>
             <select
               value={campaignType}
               onChange={e => setCampaignType(e.target.value)}
               className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
               required
             >
               <option value="">Selecione o tipo</option>
               {CAMPAIGN_TYPES.map(type => (
                 <option key={type} value={type}>{type}</option>
               ))}
             </select>
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Filtros de Criadores *</label>
             <span className="block text-xs text-muted-foreground mb-3">Configure quais criadores podem se candidatar à sua campanha</span>
             
             <div className="mb-4">
               <label className="block text-xs font-medium text-muted-foreground mb-2">Tipo de Criador *</label>
               <div className="space-y-2">
                 {['ugc', 'influencer', 'both'].map(type => (
                   <label key={type} className="flex items-center space-x-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={targetCreatorTypes.includes(type)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setTargetCreatorTypes(prev => [...prev, type]);
                         } else {
                           setTargetCreatorTypes(prev => prev.filter(t => t !== type));
                         }
                       }}
                       className="rounded border-input text-pink-500 focus:ring-pink-500"
                     />
                     <span className="text-sm capitalize">
                       {type === 'ugc' ? 'UGC (Conteúdo do Usuário)' : 
                        type === 'influencer' ? 'Influenciador' : 
                        'Ambos os Tipos'}
                     </span>
                   </label>
                 ))}
               </div>
             </div>

             <div className="mb-4">
               <label className="block text-xs font-medium text-muted-foreground mb-2">Faixa de Idade (opcional)</label>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs text-muted-foreground mb-1">Idade Mínima</label>
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
                   <label className="block text-xs text-muted-foreground mb-1">Idade Máxima</label>
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
             </div>

             <div className="mb-4">
               <label className="block text-xs font-medium text-muted-foreground mb-2">Gênero (opcional)</label>
               <div className="space-y-2">
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
                       className="rounded border-input text-pink-500 focus:ring-pink-500"
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
           </div>

           <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Prazo Final *</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    readOnly
                    value={deadline ? format(deadline, "PPP", { locale: ptBR }) : ""}
                    placeholder="Clique para selecionar a data"
                    className="pr-10 cursor-pointer"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-5">
             <label className="block text-xs font-medium text-muted-foreground mb-1">Em quais estados a campanha será divulgada? *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedStates.map(state => (
                <span
                  key={state}
                  className="flex items-center bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-xs font-medium gap-1"
                >
                  {state}
                  <button
                    type="button"
                    className="ml-1 text-pink-400 hover:text-pink-700"
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
                  className="rounded border-input text-pink-500 focus:ring-pink-500"
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

          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Logo da Campanha (upload imagem)</label>
            <div
              className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background min-h-[90px]",
                dragActive && "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clique para fazer upload ou arraste o arquivo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {imagePreview && (
              <div className="flex flex-col items-center mt-4">
                <div className="relative w-40 h-40">
                  <Image
                    src={imagePreview}
                    alt="Logo Preview"
                    fill
                    className="rounded-lg object-contain border shadow"
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
             <label className="block text-xs font-medium text-muted-foreground mb-1">Anexos (opcional)</label>
             <div
               className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition bg-background min-h-[90px]"
               onClick={() => attachmentInputRef.current?.click()}
             >
               <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
               <span className="text-xs text-muted-foreground">Clique para fazer upload de anexos</span>
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
                   <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-background rounded flex items-center justify-center">
                         <span className="text-xs font-medium">
                           {attachment.name.split('.').pop()?.toUpperCase()}
                         </span>
                       </div>
                       <div>
                         <p className="text-sm font-medium truncate max-w-[200px]">{attachment.name}</p>
                         <p className="text-xs text-muted-foreground">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                       </div>
                     </div>
                     <Button
                       type="button"
                       size="sm"
                       variant="destructive"
                       onClick={() => removeAttachment(index)}
                       className="p-1 h-8 w-8"
                       title="Remover anexo"
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
           </div>
           
           <div className="w-full flex justify-end items-center pt-6">
           <Button
             type="submit"
             disabled={isCreating}
             className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-base py-3 px-6 rounded-lg shadow-lg flex items-center gap-2"
             style={{ minWidth: 180 }}
           >
             {isCreating ? (
               <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 Criando...
               </>
             ) : (
               <>
                 <PlusCircle className="w-5 h-5 mr-1" />
                 Criar Campanha
               </>
             )}
           </Button>
           </div>
        </div>
      </form>
    </div>
  )
}
