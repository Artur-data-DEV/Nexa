"use client"

import { useEffect, useState, MouseEvent } from "react"
import { Contract } from "@/domain/entities/contract"
import { Button } from "@/presentation/components/ui/button"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Label } from "@/presentation/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Loader2, Save, Printer, FileText } from "lucide-react"
import { toast } from "sonner"
import { ApiContractRepository } from "@/infrastructure/repositories/contract-repository"
import { api } from "@/infrastructure/api/axios-adapter"

const contractRepository = new ApiContractRepository(api)

interface ContractBriefingProps {
    contract: Contract
    onUpdate: (updatedContract: Contract) => void
    isEditable: boolean
}

export function ContractBriefing({ contract, onUpdate, isEditable }: ContractBriefingProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [briefing, setBriefing] = useState({
        objectives: contract.briefing?.objectives || "",
        target_audience: contract.briefing?.target_audience || "",
        key_messages: contract.briefing?.key_messages || "",
        channels: contract.briefing?.channels || "",
        deadlines: contract.briefing?.deadlines || "",
        brand_requirements: contract.briefing?.brand_requirements || ""
    })

    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Debounced auto-save
    useEffect(() => {
        if (!hasUnsavedChanges) return

        const timer = setTimeout(() => {
            handleSave(true)
        }, 2000)

        return () => clearTimeout(timer)
    }, [briefing, hasUnsavedChanges])

    const handleChange = (field: string, value: string) => {
        setBriefing(prev => ({ ...prev, [field]: value }))
        setHasUnsavedChanges(true)
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        
        if (!briefing.objectives.trim()) newErrors.objectives = "Objetivos são obrigatórios"
        if (!briefing.target_audience.trim()) newErrors.target_audience = "Público-alvo é obrigatório"
        if (!briefing.key_messages.trim()) newErrors.key_messages = "Mensagens principais são obrigatórias"
        if (!briefing.channels.trim()) newErrors.channels = "Canais de divulgação são obrigatórios"
        if (!briefing.deadlines.trim()) newErrors.deadlines = "Prazos e cronograma são obrigatórios"
        if (!briefing.brand_requirements.trim()) newErrors.brand_requirements = "Requisitos da marca são obrigatórios"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (isAutoSaveParam: boolean | MouseEvent<HTMLButtonElement> = false) => {
        const isAutoSave = typeof isAutoSaveParam === 'boolean' ? isAutoSaveParam : false

        if (!isAutoSave && !validate()) {
            toast.error("Por favor, preencha todos os campos obrigatórios")
            return
        }

        if (isAutoSave) {
            setIsAutoSaving(true)
        } else {
            setIsLoading(true)
        }

        try {
            // Prepare requirements content based on briefing as an object for better formatting
            const requirementsObject = {
                "Objetivos": briefing.objectives,
                "Público-alvo": briefing.target_audience,
                "Mensagens Principais": briefing.key_messages,
                "Canais": briefing.channels,
                "Prazos": briefing.deadlines,
                "Requisitos da Marca": briefing.brand_requirements
            }

            const updatedContract = await contractRepository.update(contract.id, {
                briefing: briefing,
                requirements: requirementsObject
            })

            onUpdate(updatedContract)
            setLastSaved(new Date())
            setHasUnsavedChanges(false)
            
            if (!isAutoSave) {
                toast.success("Briefing salvo com sucesso!")
            }
        } catch (error) {
            console.error("Error saving briefing:", error)
            if (!isAutoSave) {
                toast.error("Erro ao salvar briefing. Tente recarregar a página.")
            }
        } finally {
            if (isAutoSave) {
                setIsAutoSaving(false)
            } else {
                setIsLoading(false)
            }
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const renderError = (field: string) => {
        if (!errors[field]) return null
        return <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    }

    const parsedBudget =
        typeof contract.budget === "number"
            ? contract.budget
            : typeof contract.budget === "string"
                ? (() => {
                    const rawBudget = contract.budget.trim()
                    if (!rawBudget) return 0

                    if (rawBudget.includes(",")) {
                        return Number(rawBudget.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."))
                    }

                    return Number(rawBudget.replace(/[^\d.-]/g, ""))
                })()
                : 0

    const budgetDisplay =
        typeof contract.formatted_budget === "string" && contract.formatted_budget.trim() !== ""
            ? contract.formatted_budget
            : Number.isFinite(parsedBudget)
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsedBudget)
                : "—"

    return (
        <div className="space-y-6">
            {/* Printable Header - Only visible when printing */}
            <div className="hidden print:block space-y-6 mb-8">
                <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">{contract.title}</h1>
                    <p className="text-muted-foreground">Contrato #{contract.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Orçamento</h3>
                        <p className="text-lg">{budgetDisplay}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Prazo Estimado</h3>
                        <p className="text-lg">{contract.estimated_days} dias</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Data de Início</h3>
                        <p>{contract.start_date ? new Date(contract.start_date).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Status</h3>
                        <p className="capitalize">{contract.status}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold text-muted-foreground">Descrição do Contrato</h3>
                    <p className="whitespace-pre-wrap">{contract.description}</p>
                </div>

                <div className="border-t pt-4">
                    <h2 className="text-xl font-bold mb-4">Briefing da Campanha</h2>
                </div>
            </div>

            <div className="flex items-center justify-between no-print">
                <div>
                    <h3 className="text-lg font-medium">Briefing da Campanha</h3>
                    <p className="text-sm text-muted-foreground">
                        Defina os detalhes e diretrizes para a execução do contrato.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {isAutoSaving && <span className="text-sm text-muted-foreground animate-pulse">Salvando...</span>}
                    {!isAutoSaving && lastSaved && <span className="text-sm text-muted-foreground">Salvo às {lastSaved.toLocaleTimeString()}</span>}
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                    {isEditable && (
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 print:block print:space-y-6">
                <Card>
                    <CardHeader className="print:hidden">
                        <CardTitle className="text-base">Informações Gerais</CardTitle>
                        <CardDescription>
                            Objetivos e público-alvo da campanha
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 print:pt-0">
                        <div className="space-y-2">
                            <Label htmlFor="objectives">Objetivos da Campanha</Label>
                            {isEditable ? (
                                <Textarea
                                    id="objectives"
                                    placeholder="Ex: Aumentar o reconhecimento da marca..."
                                    value={briefing.objectives}
                                    onChange={(e) => handleChange("objectives", e.target.value)}
                                    className="min-h-25"
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {briefing.objectives || "Não informado"}
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="target_audience">Público-Alvo</Label>
                            {isEditable ? (
                                <Input
                                    id="target_audience"
                                    placeholder="Ex: Jovens de 18-25 anos interessados em tecnologia"
                                    value={briefing.target_audience}
                                    onChange={(e) => handleChange("target_audience", e.target.value)}
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {briefing.target_audience || "Não informado"}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="print:hidden">
                        <CardTitle className="text-base">Conteúdo e Mensagem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 print:pt-0">
                        <div className="space-y-2">
                            <Label htmlFor="key_messages">Mensagens Principais</Label>
                            {isEditable ? (
                                <Textarea
                                    id="key_messages"
                                    placeholder="Pontos chave que devem ser abordados"
                                    value={briefing.key_messages}
                                    onChange={(e) => handleChange("key_messages", e.target.value)}
                                    className="min-h-25"
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {briefing.key_messages || "Não informado"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="channels">Canais de Divulgação</Label>
                            {isEditable ? (
                                <Input
                                    id="channels"
                                    placeholder="Ex: Instagram Reels, TikTok"
                                    value={briefing.channels}
                                    onChange={(e) => handleChange("channels", e.target.value)}
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {briefing.channels || "Não informado"}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="print:hidden">
                        <CardTitle className="text-base">Execução</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 print:pt-0">
                        <div className="space-y-2">
                            <Label htmlFor="deadlines">Prazos e Cronograma</Label>
                            {isEditable ? (
                                <Textarea
                                    id="deadlines"
                                    placeholder="Datas importantes e entregas"
                                    value={briefing.deadlines}
                                    onChange={(e) => handleChange("deadlines", e.target.value)}
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {briefing.deadlines || "Não informado"}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brand_requirements">Requisitos da Marca (Do's and Don'ts)</Label>
                            {isEditable ? (
                                <Textarea
                                    id="brand_requirements"
                                    placeholder="O que pode e o que não pode ser feito"
                                    value={briefing.brand_requirements}
                                    onChange={(e) => handleChange("brand_requirements", e.target.value)}
                                    className="min-h-37.5"
                                />
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {briefing.brand_requirements || "Não informado"}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    .card {
                        border: none;
                        box-shadow: none;
                    }
                }
            `}</style>
        </div>
    )
}
