"use client"

import React, { useState, useRef } from "react"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/presentation/components/ui/select"
import { NICHES } from "@/lib/niches"
import { UploadIcon, XIcon } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import { BrandProfile } from "@/infrastructure/repositories/brand-profile-repository"
import Image from "next/image"

const BRAZILIAN_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
]

const MAX_IMAGE_SIZE_MB = 5
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface EditBrandProfileProps {
  initialProfile: BrandProfile
  onCancel: () => void
  onSave: (profile: BrandProfile & { image?: File | null }) => void
  isLoading?: boolean
}

export const EditBrandProfile: React.FC<EditBrandProfileProps> = ({ initialProfile, onCancel, onSave, isLoading = false }) => {
  const [profile, setProfile] = useState<BrandProfile & { image?: File | null }>(() => {
    const niches = Array.isArray(initialProfile.niches)
      ? initialProfile.niches
      : initialProfile.niche
        ? [initialProfile.niche]
        : []

    return {
      ...initialProfile,
      niches,
      niche: niches[0],
    }
  })
  const [imagePreview, setImagePreview] = useState<string | null>(initialProfile.logo_url || null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requiredFieldLabels: Record<string, string> = {
    company_name: "Nome da Empresa",
    cnpj: "CNPJ",
    description: "Sobre a Empresa",
    address: "Endereço",
    city: "Cidade",
    state: "Estado",
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Apenas arquivos JPG, PNG ou WebP são permitidos.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Tamanho máximo do arquivo é ${MAX_IMAGE_SIZE_MB}MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setProfile((p) => ({ ...p, image: file }))
    setError("")
  }

  const handleRemoveImage = () => {
    setProfile((p) => ({ ...p, image: null, logo_url: undefined }))
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setProfile((p) => ({ ...p, [name]: value }))
  }

  const handleNicheToggle = (niche: string) => {
    const currentNiches = profile.niches || []
    const nextNiches = currentNiches.includes(niche)
      ? currentNiches.filter((item) => item !== niche)
      : [...currentNiches, niche]

    setProfile((p) => ({
      ...p,
      niches: nextNiches,
      niche: nextNiches[0],
    }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedNiches = profile.niches && profile.niches.length > 0
      ? profile.niches
      : profile.niche
        ? [profile.niche]
        : []

    const missingFields = Object.keys(requiredFieldLabels).filter((field) => {
      const value = (profile as unknown as Record<string, unknown>)[field]
      if (typeof value === "string") return value.trim() === ""
      return !value
    })
    if (selectedNiches.length === 0) {
      missingFields.push("niches")
    }
    if (missingFields.length > 0) {
      setError(`Preencha os campos obrigatórios: ${missingFields.map((field) => requiredFieldLabels[field] || "Nichos").join(", ")}`)
      return
    }

    setError("")
    onSave({
      ...profile,
      niches: selectedNiches,
      niche: selectedNiches[0],
    })
  }

  return (
    <div className="bg-background rounded-xl p-4 sm:p-6 space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-center">Editar Perfil da Marca</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative w-24 h-24">
            <div className="w-full h-full rounded-full border-2 border-dashed border-muted flex items-center justify-center bg-muted/50 overflow-hidden relative">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Logo"
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="text-xs font-bold text-muted-foreground text-center px-2">
                  Logo
                </div>
              )}
            </div>

            <button
              type="button"
              className="absolute -bottom-1 -right-1 bg-background border rounded-full p-2 shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="w-4 h-4" />
            </button>

            {imagePreview && (
              <button
                type="button"
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                onClick={handleRemoveImage}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Empresa *</label>
            <Input
              name="company_name"
              value={profile.company_name || ""}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CNPJ *</label>
            <Input
              name="cnpj"
              value={profile.cnpj || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              name="website"
              value={profile.website || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nichos *</label>
            <Select
              onValueChange={(value) => {
                if (value && !profile.niches?.includes(value)) {
                  handleNicheToggle(value)
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar nicho" />
              </SelectTrigger>
              <SelectContent>
                {NICHES.filter((niche) => !profile.niches?.includes(niche)).map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.niches?.map((niche) => (
                <div key={niche} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm">
                  <span>{niche}</span>
                  <button type="button" onClick={() => handleNicheToggle(niche)} className="hover:text-destructive">
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-2">
            <label className="text-sm font-medium">Sobre a Empresa *</label>
            <Textarea
              name="description"
              value={profile.description || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Descreva sua empresa, missão e valores..."
              className="min-h-25"
              required
            />
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-2">
            <label className="text-sm font-medium">Endereço *</label>
            <Input
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Rua, número, bairro"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade *</label>
            <Input
              name="city"
              value={profile.city || ""}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado *</label>
            <Select
              value={profile.state}
              onValueChange={(val) => setProfile((p) => ({ ...p, state: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <div className="text-destructive text-sm text-center">{error}</div>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}

