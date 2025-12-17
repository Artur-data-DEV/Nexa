"use client"

import Link from "next/link"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { AuthGuard } from "@/presentation/components/auth/auth-guard"
import { Alert, AlertDescription, AlertTitle } from "@/presentation/components/ui/alert"
import { Button } from "@/presentation/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card"
import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react"

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-800 dark:text-red-200">
              Acesso negado
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              Você não tem permissão para acessar o painel administrativo. Apenas
              administradores podem acessar esta área.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Voltar para o dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                Ir para a página inicial
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminOnly>
        <main className="min-h-screen bg-background px-4 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Acesso administrativo
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Painel do Administrador
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Gerencie usuários, campanhas e finanças da plataforma. Esta seção é
                exclusiva para administradores da Nexa.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Verificação de Saques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Analise saques realizados pelos criadores, compare dados bancários e
                    identifique rapidamente inconsistências ou possíveis fraudes.
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/admin/withdrawals/verification">
                      Abrir verificação de saques
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Campanhas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Gerencie o funil de campanhas da plataforma: aprove ou rejeite campanhas
                    pendentes e acompanhe o desempenho das campanhas ativas.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A moderação completa de campanhas ainda está sendo migrada para o Next.
                    Utilize o painel administrativo clássico para operações avançadas.
                  </p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/admin/campaigns/pending">
                      Aprovar campanhas pendentes
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Usuários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Visualize e gerencie criadores, marcas e estudantes, incluindo status
                    de conta, verificação de e-mail e atividade recente.
                  </p>
                  <Button variant="outline" disabled className="mt-2">
                    Gestão de usuários em breve
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Verificação de Alunos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aprove ou rejeite solicitações de verificação estudantil e acompanhe o
                    uso do plano especial para estudantes.
                  </p>
                    <Button variant="outline" disabled className="mt-2">
                      Verificação de alunos em breve
                    </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Rankings e Guias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Acompanhe rankings de marcas, materiais educativos e notificações
                    importantes sobre a saúde da plataforma.
                  </p>
                  <Button variant="outline" disabled className="mt-2">
                    Ferramentas de analytics em breve
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </AdminOnly>
    </AuthGuard>
  )
}
