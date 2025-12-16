"use client"

import { useAuth } from "@/presentation/contexts/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Mail, MapPin, User as UserIcon, Calendar } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card className="h-fit">
            <CardHeader className="items-center text-center">
                <Avatar className="h-32 w-32">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-4xl">{user.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4">{user.name}</CardTitle>
                <Badge variant="secondary" className="mt-2 capitalize">
                    {user.role === 'brand' ? 'Marca' : 'Criador'}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                </div>
                {user.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Membro desde {new Date(user.created_at).getFullYear()}</span>
                    </div>
                )}
                
                <Button className="w-full" variant="outline">
                    Editar Foto
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo</label>
                        <div className="rounded-md border p-3 bg-muted/50">{user.name}</div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <div className="rounded-md border p-3 bg-muted/50">{user.email}</div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">WhatsApp</label>
                        <div className="rounded-md border p-3 bg-muted/50">{user.whatsapp || "Não informado"}</div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Função</label>
                        <div className="rounded-md border p-3 bg-muted/50 capitalize">{user.role}</div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
