"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card"
import { Button } from "@/presentation/components/ui/button"
import { Badge } from "@/presentation/components/ui/badge"
import { Input } from "@/presentation/components/ui/input"
import { Textarea } from "@/presentation/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/presentation/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs"
import { Bell, Send, Users, History, AlertCircle } from "lucide-react"
import { toast } from "sonner"
// import { api } from "@/infrastructure/api/axios-adapter" // Uncomment when API is ready

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [audience, setAudience] = useState("all")
    const [sending, setSending] = useState(false)

    const handleSendNotification = async () => {
        if (!title || !message) {
            toast.error("Por favor preencha título e mensagem")
            return
        }

        setSending(true)
        try {
            // TODO: Connect to backend endpoint when available
            // await api.post("/admin/notifications/send", { title, message, audience })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success(`Notificação enviada para: ${audience === 'all' ? 'Todos os usuários' : audience}`)
            setTitle("")
            setMessage("")
        } catch (error) {
            console.error("Failed to send notification:", error)
            toast.error("Falha ao enviar notificação")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Badge variant="outline" className="mb-2">Comunicação</Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Notificações do Sistema
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Envie comunicados importantes e gerencie as notificações da plataforma.
                </p>
            </div>

            <Tabs defaultValue="send" className="w-full">
                <TabsList>
                    <TabsTrigger value="send">Nova Notificação</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Envios</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-4 pt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Enviar Comunicado
                                </CardTitle>
                                <CardDescription>
                                    Envie notificações push e emails para grupos de usuários.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Público Alvo</label>
                                    <Select value={audience} onValueChange={setAudience}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o público" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Usuários</SelectItem>
                                            <SelectItem value="creators">Apenas Criadores</SelectItem>
                                            <SelectItem value="brands">Apenas Marcas</SelectItem>
                                            <SelectItem value="students">Apenas Alunos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Título</label>
                                    <Input
                                        placeholder="Ex: Manutenção Programada"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mensagem</label>
                                    <Textarea
                                        placeholder="Digite o conteúdo da notificação..."
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {message.length} caracteres
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Button className="w-full" onClick={handleSendNotification} disabled={sending}>
                                        {sending ? (
                                            <>Enviando...</>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Enviar Notificação
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    Dicas de Comunicação
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted p-4 text-sm">
                                    <h4 className="font-semibold mb-2">Melhores Práticas</h4>
                                    <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                                        <li>Use títulos curtos e diretos (max 40 caracteres recomendados).</li>
                                        <li>Sempre verifique a ortografia antes de enviar.</li>
                                        <li>Evite enviar notificações fora do horário comercial para assuntos não urgentes.</li>
                                        <li>Use a segmentação para aumentar a relevância.</li>
                                    </ul>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-sm">Estimativa de Alcance</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {audience === 'all' ? '1,240' : audience === 'creators' ? '850' : audience === 'brands' ? '120' : '270'}
                                        <span className="text-sm font-normal text-muted-foreground ml-2">usuários</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Histórico Recente
                            </CardTitle>
                            <CardDescription>
                                Últimas notificações enviadas pelo sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {[
                                    { title: "Atualização de Termos", date: "Hoje, 10:00", sent_to: "Todos", status: "Enviado" },
                                    { title: "Nova Campanha Disponível", date: "Ontem, 15:30", sent_to: "Criadores", status: "Enviado" },
                                    { title: "Lembrete de Pagamento", date: "26 Jan, 09:00", sent_to: "Marcas", status: "Enviado" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <Bell className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{item.title}</div>
                                                <div className="text-xs text-muted-foreground">Enviado em {item.date} • Para: {item.sent_to}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
