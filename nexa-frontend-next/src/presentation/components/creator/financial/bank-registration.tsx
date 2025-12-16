"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Input } from "@/presentation/components/ui/input"
import { Button } from "@/presentation/components/ui/button"
import { Label } from "@/presentation/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select"
import { toast } from "sonner"
import { 
  BanknoteIcon, 
  User, 
  Building2, 
  Hash, 
  Shield, 
  Loader2,
  Save,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { BankInfo, BankRegistrationRequest } from "@/domain/entities/financial"
import { ApiFinancialRepository } from "@/infrastructure/repositories/financial-repository"
import { GetBankInfoUseCase } from "@/application/use-cases/get-bank-info.use-case"
import { RegisterBankUseCase } from "@/application/use-cases/register-bank.use-case"
import { UpdateBankInfoUseCase } from "@/application/use-cases/update-bank-info.use-case"
import { DeleteBankInfoUseCase } from "@/application/use-cases/delete-bank-info.use-case"
import { api } from "@/infrastructure/api/axios-adapter"
import { cn } from "@/lib/utils"

const financialRepository = new ApiFinancialRepository(api)
const getBankInfoUseCase = new GetBankInfoUseCase(financialRepository)
const registerBankUseCase = new RegisterBankUseCase(financialRepository)
const updateBankInfoUseCase = new UpdateBankInfoUseCase(financialRepository)
const deleteBankInfoUseCase = new DeleteBankInfoUseCase(financialRepository)

interface ValidationErrors {
  [key: string]: string
}

export function BankRegistration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [existingBankInfo, setExistingBankInfo] = useState<BankInfo | null>(null)
  const [bankInfo, setBankInfo] = useState<BankRegistrationRequest>({
    bank_code: '',
    agencia: '',
    agencia_dv: '',
    conta: '',
    conta_dv: '',
    cpf: '',
    name: ''
  })

  const bankOptions = [
    { code: '001', name: 'Banco do Brasil S.A.' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Bradesco S.A.' },
    { code: '341', name: 'Itaú Unibanco S.A.' },
    { code: '033', name: 'Santander (Brasil) S.A.' },
    { code: '422', name: 'Banco Safra S.A.' },
    { code: '077', name: 'Banco Inter S.A.' },
    { code: '212', name: 'Banco Original S.A.' },
    { code: '336', name: 'Banco C6 S.A.' },
    { code: '260', name: 'Nu Pagamentos S.A. (Nubank)' },
    { code: '208', name: 'BTG Pactual S.A.' },
    { code: '623', name: 'Banco PAN S.A.' },
    { code: '041', name: 'Banrisul – Banco do Estado do Rio Grande do Sul S.A.' },
    { code: '748', name: 'Sicredi – Cooperativa de Crédito' },
    { code: '756', name: 'Sicoob – Sistema de Cooperativas de Crédito' }
  ]

  const loadBankInfo = async () => {
    setIsLoading(true)
    try {
      const data = await getBankInfoUseCase.execute()
      if (data && data.bank_code) {
        setExistingBankInfo(data)
        setBankInfo({
          bank_code: data.bank_code,
          agencia: data.agencia,
          agencia_dv: data.agencia_dv,
          conta: data.conta,
          conta_dv: data.conta_dv,
          cpf: data.cpf,
          name: data.name
        })
      }
    } catch (error) {
      // It's okay if 404 (no bank info), but log other errors
      console.log("No bank info found or error loading", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBankInfo()
  }, [])

  const validateCPF = useCallback((cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}

    if (!bankInfo.bank_code.trim()) {
      newErrors.bank_code = 'Código do banco é obrigatório'
    } else if (!/^\d{3,4}$/.test(bankInfo.bank_code)) {
      newErrors.bank_code = 'Código do banco deve ter 3 ou 4 dígitos'
    }

    if (!bankInfo.agencia.trim()) {
      newErrors.agencia = 'Agência é obrigatória'
    } else if (!/^\d{1,5}$/.test(bankInfo.agencia)) {
      newErrors.agencia = 'Agência deve ter até 5 dígitos'
    }

    if (!bankInfo.agencia_dv.trim()) {
      newErrors.agencia_dv = 'Dígito da agência é obrigatório'
    } else if (!/^\d{1,2}$/.test(bankInfo.agencia_dv)) {
      newErrors.agencia_dv = 'Dígito da agência deve ter 1 ou 2 dígitos'
    }

    if (!bankInfo.conta.trim()) {
      newErrors.conta = 'Conta é obrigatória'
    } else if (!/^\d{1,12}$/.test(bankInfo.conta)) {
      newErrors.conta = 'Conta deve ter até 12 dígitos'
    }

    if (!bankInfo.conta_dv.trim()) {
      newErrors.conta_dv = 'Dígito da conta é obrigatório'
    } else if (!/^\d{1,2}$/.test(bankInfo.conta_dv)) {
      newErrors.conta_dv = 'Dígito da conta deve ter 1 ou 2 dígitos'
    }

    if (!bankInfo.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(bankInfo.cpf)) {
      newErrors.cpf = 'CPF deve estar no formato XXX.XXX.XXX-XX'
    } else if (!validateCPF(bankInfo.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!bankInfo.name.trim()) {
      newErrors.name = 'Nome do titular é obrigatório'
    } else if (bankInfo.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [bankInfo, validateCPF])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBankInfo(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (value: string) => {
    setBankInfo(prev => ({
      ...prev,
      bank_code: value
    }))
    if (errors.bank_code) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.bank_code
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário")
      return
    }

    setIsSaving(true)
    try {
      if (existingBankInfo) {
        await updateBankInfoUseCase.execute(bankInfo)
        toast.success("Dados bancários atualizados com sucesso")
      } else {
        await registerBankUseCase.execute(bankInfo)
        toast.success("Dados bancários cadastrados com sucesso")
      }
      await loadBankInfo()
      setIsEditing(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Erro ao salvar dados bancários")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover suas informações bancárias?')) {
      return
    }
    
    setIsSaving(true)
    try {
      await deleteBankInfoUseCase.execute()
      toast.success("Dados bancários removidos com sucesso")
      setExistingBankInfo(null)
      setBankInfo({
        bank_code: '',
        agencia: '',
        agencia_dv: '',
        conta: '',
        conta_dv: '',
        cpf: '',
        name: ''
      })
      setIsEditing(false)
    } catch (error: any) {
      console.error(error)
      toast.error("Erro ao remover dados bancários")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (existingBankInfo) {
      setBankInfo({
        bank_code: existingBankInfo.bank_code,
        agencia: existingBankInfo.agencia,
        agencia_dv: existingBankInfo.agencia_dv,
        conta: existingBankInfo.conta,
        conta_dv: existingBankInfo.conta_dv,
        cpf: existingBankInfo.cpf,
        name: existingBankInfo.name
      })
    }
    setErrors({})
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingBankInfo ? 'Informações Bancárias' : 'Cadastro Bancário'}</CardTitle>
        <CardDescription>
          {existingBankInfo 
            ? 'Gerencie suas informações bancárias para receber pagamentos'
            : 'Cadastre sua conta bancária para receber seus pagamentos.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingBankInfo && !isEditing ? (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Dados Bancários</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Banco</Label>
                  <p className="text-foreground">{existingBankInfo.bank_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Agência</Label>
                  <p className="text-foreground">{existingBankInfo.agencia}-{existingBankInfo.agencia_dv}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Conta</Label>
                  <p className="text-foreground">{existingBankInfo.conta}-{existingBankInfo.conta_dv}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                  <p className="text-foreground">{existingBankInfo.cpf}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nome do Titular</Label>
                  <p className="text-foreground">{existingBankInfo.name}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Informações bancárias configuradas</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bank_code">Banco</Label>
              <Select 
                value={bankInfo.bank_code} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className={errors.bank_code ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bankOptions.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bank_code && <p className="text-sm text-red-500">{errors.bank_code}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agencia">Agência</Label>
                <div className="flex items-center relative">
                  <Building2 className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="agencia"
                    name="agencia"
                    value={bankInfo.agencia}
                    onChange={handleChange}
                    className={`pl-9 ${errors.agencia ? "border-red-500" : ""}`}
                    placeholder="0000"
                  />
                </div>
                {errors.agencia && <p className="text-sm text-red-500">{errors.agencia}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencia_dv">Dígito Agência</Label>
                <Input
                  id="agencia_dv"
                  name="agencia_dv"
                  value={bankInfo.agencia_dv}
                  onChange={handleChange}
                  className={errors.agencia_dv ? "border-red-500" : ""}
                  placeholder="0"
                  maxLength={2}
                />
                {errors.agencia_dv && <p className="text-sm text-red-500">{errors.agencia_dv}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conta">Conta Corrente</Label>
                <div className="flex items-center relative">
                  <Hash className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="conta"
                    name="conta"
                    value={bankInfo.conta}
                    onChange={handleChange}
                    className={`pl-9 ${errors.conta ? "border-red-500" : ""}`}
                    placeholder="00000"
                  />
                </div>
                {errors.conta && <p className="text-sm text-red-500">{errors.conta}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta_dv">Dígito Conta</Label>
                <Input
                  id="conta_dv"
                  name="conta_dv"
                  value={bankInfo.conta_dv}
                  onChange={handleChange}
                  className={errors.conta_dv ? "border-red-500" : ""}
                  placeholder="0"
                  maxLength={2}
                />
                {errors.conta_dv && <p className="text-sm text-red-500">{errors.conta_dv}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo do Titular</Label>
              <div className="flex items-center relative">
                <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={bankInfo.name}
                  onChange={handleChange}
                  className={`pl-9 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Nome igual ao do CPF"
                />
              </div>
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do Titular</Label>
              <div className="flex items-center relative">
                <Shield className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  name="cpf"
                  value={bankInfo.cpf}
                  onChange={handleChange}
                  className={`pl-9 ${errors.cpf ? "border-red-500" : ""}`}
                  placeholder="000.000.000-00"
                />
              </div>
              {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {existingBankInfo ? "Atualizar Dados Bancários" : "Salvar Dados Bancários"}
                  </>
                )}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
