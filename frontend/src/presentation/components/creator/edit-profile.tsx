"use client"

import React, { useEffect, useRef, useState } from "react"
import { Input } from "@/presentation/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/presentation/components/ui/select"
import { NICHES } from "@/lib/niches"
import { UploadIcon, XIcon, Plus, Trash2 } from "lucide-react"
import { Button } from "@/presentation/components/ui/button"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ptBR } from "date-fns/locale"
if (typeof registerLocale === "function") {
  registerLocale("pt-BR", ptBR)
}
import { User } from "@/domain/entities/user"
import Image from "next/image"
import { format } from "date-fns"

const BRAZILIAN_STATES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
]

const LANGUAGES = [
  "Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Japonês",
  "Chinês", "Coreano", "Russo", "Árabe", "Hindi", "Holandês", "Sueco", "Norueguês",
  "Dinamarquês", "Finlandês", "Polonês", "Tcheco", "Húngaro", "Romeno", "Búlgaro",
  "Croata", "Sérvio", "Eslovaco", "Esloveno", "Grego", "Turco", "Hebraico", "Persa",
  "Urdu", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Punjabi", "Outros"
]

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase()

const MAX_IMAGE_SIZE_MB = 5
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface EditProfileProps {
  initialProfile: User
  onCancel: () => void
  onSave: (profile: User & { image?: File | null }) => void
  isLoading?: boolean
}

export const EditProfile: React.FC<EditProfileProps> = ({ initialProfile, onCancel, onSave, isLoading = false }) => {
  const [profile, setProfile] = useState<User & { image?: File | null }>({ ...initialProfile, image: null })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const safeParseDate = (value: unknown): Date | null => {
    if (!value) return null
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value
    }
    if (typeof value === "string") {
      const s = value.trim()
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
      if (iso) {
        const [, y, m, d] = iso
        const dt = new Date(Number(y), Number(m) - 1, Number(d))
        return isNaN(dt.getTime()) ? null : dt
      }
      const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
      if (br) {
        const [, d, m, y] = br
        const dt = new Date(Number(y), Number(m) - 1, Number(d))
        return isNaN(dt.getTime()) ? null : dt
      }
      const dt = new Date(s)
      return isNaN(dt.getTime()) ? null : dt
    }
    return null
  }

  useEffect(() => {
    if (initialProfile.avatar && initialProfile.avatar !== imagePreview) {
      setImagePreview(initialProfile.avatar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProfile])

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
    setProfile((p) => ({ ...p, image: null }))
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setProfile((p) => ({ ...p, [name]: value }))
  }

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = profile.languages || []
    setProfile((p) => ({
      ...p,
      languages: currentLanguages.includes(language)
        ? currentLanguages.filter((l: string) => l !== language)
        : [...currentLanguages, language],
    }))
  }

  const handleAddLink = () => {
    const currentLinks = profile.portfolio?.project_links || []
    setProfile((p) => ({
      ...p,
      portfolio: {
        ...p.portfolio,
        user_id: p.id,
        title: p.portfolio?.title || '',
        bio: p.portfolio?.bio || '',
        items: p.portfolio?.items || [],
        project_links: [...currentLinks, { title: "", url: "" }]
      }
    }))
  }

  const handleRemoveLink = (index: number) => {
    const currentLinks = profile.portfolio?.project_links || []
    setProfile((p) => ({
      ...p,
      portfolio: {
        ...p.portfolio!,
        project_links: currentLinks.filter((_, i) => i !== index)
      }
    }))
  }

  const handleLinkChange = (index: number, field: "title" | "url", value: string) => {
    const currentLinks = [...(profile.portfolio?.project_links || [])]
    currentLinks[index] = { ...currentLinks[index], [field]: value }
    setProfile((p) => ({
      ...p,
      portfolio: {
        ...p.portfolio!,
        project_links: currentLinks
      }
    }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile.gender) return setError("Gênero é obrigatório")
    if (!profile.birth_date) return setError("Data de nascimento é obrigatória")
    if (!profile.niche) return setError("Nicho é obrigatório")

    if (
      (profile.creator_type === "influencer" || profile.creator_type === "both") &&
      !profile.instagram_handle?.trim()
    ) {
      return setError("Instagram é obrigatório para influenciadores")
    }

    setError("")
    onSave(profile)
  }

  return (
    <div className="bg-background rounded-xl p-4 sm:p-6 space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-center">Editar Perfil</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative w-24 h-24">
            <div className="w-full h-full rounded-full border-2 border-dashed border-muted flex items-center justify-center bg-muted/50 overflow-hidden relative">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile"
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">
                  {getInitials(profile.name || "U")}
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
            <label className="text-sm font-medium">Nome Completo</label>
            <Input
              name="name"
              value={profile.name || ""}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              value={profile.email || ""}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={profile.state}
              onValueChange={(val) => setProfile((p) => ({ ...p, state: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu estado" />
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Profissão</label>
            <Input
              name="profession"
              value={profile.profession || ""}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gênero *</label>
            <Select
              value={profile.gender}
              onValueChange={(val) => setProfile((p) => ({ ...p, gender: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="other">Não-binário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data de Nascimento *</label>
            <div className="w-full">
              <DatePicker
                selected={safeParseDate(profile.birth_date)}
                onChange={(date: Date | null) => {
                  setProfile((p) => ({
                    ...p,
                    birth_date: date ? format(date, "yyyy-MM-dd") : undefined,
                  }))
                }}
                locale="pt-BR"
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                customInput={<Input />}
                placeholderText="Selecione uma data"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Criador</label>
            <Select
              value={profile.creator_type}
              onValueChange={(val) => setProfile((p) => ({ ...p, creator_type: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ugc">UGC</SelectItem>
                <SelectItem value="influencer">Influenciador</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nicho *</label>
            <Select
              value={profile.niche}
              onValueChange={(val) => setProfile((p) => ({ ...p, niche: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-2">
            <label className="text-sm font-medium">Idiomas</label>
            <Select
              onValueChange={(value) => {
                if (value && !profile.languages?.includes(value)) {
                  handleLanguageToggle(value)
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar idioma" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter((l) => !profile.languages?.includes(l)).map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-wrap gap-2 mt-2">
                {profile.languages?.map((lang: string) => (
                    <div key={lang} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm">
                        <span>{lang}</span>
                        <button type="button" onClick={() => handleLanguageToggle(lang)} className="hover:text-destructive">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
                <label className="text-sm font-medium">Instagram</label>
                <Input name="instagram_handle" value={profile.instagram_handle || ""} onChange={handleChange} placeholder="@usuario" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">TikTok</label>
                <Input name="tiktok_handle" value={profile.tiktok_handle || ""} onChange={handleChange} placeholder="@usuario" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">YouTube</label>
                <Input name="youtube_channel" value={profile.youtube_channel || ""} onChange={handleChange} placeholder="Canal" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Twitter</label>
                <Input name="twitter_handle" value={profile.twitter_handle || ""} onChange={handleChange} placeholder="@usuario" />
            </div>
        </div>

        <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Links do Portfólio</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Link
                </Button>
            </div>
            
            <div className="space-y-3">
                {profile.portfolio?.project_links?.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <Input 
                            placeholder="Título (ex: Meu Site)" 
                            value={link.title} 
                            onChange={(e) => handleLinkChange(index, "title", e.target.value)}
                            className="flex-1"
                        />
                        <Input 
                            placeholder="URL (https://...)" 
                            value={link.url} 
                            onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                            className="flex-2"
                        />
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleRemoveLink(index)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {(!profile.portfolio?.project_links || profile.portfolio.project_links.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-md border border-dashed">
                        Nenhum link adicionado. Adicione links para seus trabalhos anteriores.
                    </p>
                )}
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
