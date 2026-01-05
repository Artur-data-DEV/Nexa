"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Separator } from "@/presentation/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/presentation/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Navbar } from "@/presentation/components/landing/navbar";
import { Tabs, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Guide } from "@/domain/entities/guide";
import {
  BookOpen,
  Users,
  Target,
  MessageSquare,
  UserPlus,
  PlusCircle,
  CheckCircle,
  ChevronRight,
  Home,
  Image as ImageIcon,
  Play,
  Calendar,
  Wallet,
  Building2,
  UserStar,
  Video
} from "lucide-react";
import { MdOutlineLibraryBooks } from "react-icons/md";

// Repository Instance
// const guideRepository = new ApiGuideRepository(api);

// Types
interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  guides: Guide[];
}

const MOCK_GUIDES: Guide[] = [
  // BRAND GUIDES
  {
    id: 1,
    title: "Registro de Marca e Configuração",
    description: "Guia completo para criar sua conta empresarial, configurar perfil e métodos de pagamento.",
    audience: "Brand",
    steps: [
      {
        id: 101,
        title: "Criar Conta Empresarial",
        description: "Acesse a página de cadastro e selecione 'Sou Marca'. Preencha os dados da sua empresa (CNPJ, Razão Social) e dados do responsável.",
        order: 1
      },
      {
        id: 102,
        title: "Completar Perfil",
        description: "Adicione logo, descrição da marca e setor de atuação. Um perfil completo atrai mais criadores qualificados.",
        order: 2
      },
      {
        id: 103,
        title: "Configurar Pagamento",
        description: "Vá em Configurações > Pagamentos e cadastre um cartão de crédito ou conta bancária para financiar suas campanhas.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    title: "Como Criar uma Campanha de Sucesso",
    description: "Passo a passo para estruturar campanhas que atraem os melhores criadores e geram resultados.",
    audience: "Brand",
    steps: [
      {
        id: 201,
        title: "Definir Objetivos e Público",
        description: "Antes de criar, saiba qual seu objetivo (Brand Awareness, Conversão) e quem você quer atingir.",
        order: 1
      },
      {
        id: 202,
        title: "Preencher o Briefing",
        description: "Seja detalhista. Inclua referências visuais, 'Do's and Don'ts', e entregáveis esperados (ex: 1 Reels + 3 Stories).",
        order: 2
      },
      {
        id: 203,
        title: "Orçamento e Prazos",
        description: "Defina um orçamento justo e prazos realistas para candidatura, envio de conteúdo e postagem.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    title: "Aprovação e Gestão de Criadores",
    description: "Saiba como selecionar os candidatos ideais e gerenciar o fluxo de aprovação de conteúdos.",
    audience: "Brand",
    steps: [
      {
        id: 301,
        title: "Analisar Candidaturas",
        description: "Verifique o portfólio, métricas de engajamento e a proposta de valor de cada criador que se candidatou.",
        order: 1
      },
      {
        id: 302,
        title: "Aprovar Conteúdos",
        description: "Use a plataforma para receber prévias. Peça ajustes pontuais se necessário antes da aprovação final para postagem.",
        order: 2
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 7,
    title: "Gestão Financeira e Pagamentos",
    description: "Aprenda como funciona o sistema de escrow, faturamento e carteira da plataforma.",
    audience: "Brand",
    steps: [
      {
        id: 701,
        title: "Sistema de Proteção (Escrow)",
        description: "Entenda como o pagamento fica retido com segurança até que o criador entregue o conteúdo aprovado.",
        order: 1
      },
      {
        id: 702,
        title: "Adicionar Créditos",
        description: "Veja como carregar sua carteira Nexa para agilizar a contratação de múltiplos criadores.",
        order: 2
      },
      {
        id: 703,
        title: "Relatórios e Invoices",
        description: "Acesse a aba Financeiro para baixar comprovantes e relatórios de gastos mensais por campanha.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 8,
    title: "Análise de Resultados e ROI",
    description: "Como interpretar as métricas das campanhas e otimizar seus investimentos futuros.",
    audience: "Brand",
    steps: [
      {
        id: 801,
        title: "Monitoramento de Performance",
        description: "Acompanhe visualizações, taxa de engajamento e alcance real dos conteúdos produzidos.",
        order: 1
      },
      {
        id: 802,
        title: "Cálculo de CPA e ROI",
        description: "Saiba integrar seus links de trackeamento para medir conversões diretas geradas pelos criadores.",
        order: 2
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },

  // CREATOR GUIDES
  {
    id: 4,
    title: "Primeiros Passos como Criador",
    description: "Tudo o que você precisa para começar a monetizar seu conteúdo na Nexa.",
    audience: "Creator",
    steps: [
      {
        id: 401,
        title: "Cadastro de Perfil",
        description: "Cadastre-se como Criador. Conecte suas redes sociais (Instagram, TikTok, YouTube) para validar suas métricas.",
        order: 1
      },
      {
        id: 402,
        title: "Montar seu Mídia Kit",
        description: "Mantenha seu perfil atualizado com seus melhores trabalhos e nichos de atuação. Isso é seu cartão de visitas.",
        order: 2
      },
      {
        id: 403,
        title: "Verificação de Identidade",
        description: "Complete a verificação KYC para garantir sua segurança e agilizar seus recebimentos.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 5,
    title: "Enviando Propostas Vencedoras",
    description: "Melhore suas chances de ser escolhido pelas marcas com propostas profissionais.",
    audience: "Creator",
    steps: [
      {
        id: 501,
        title: "Ler o Briefing com Atenção",
        description: "Entenda exatamente o que a marca busca. Não envie propostas genéricas.",
        order: 1
      },
      {
        id: 502,
        title: "Definir Preço e Ideia",
        description: "Ofereça um valor competitivo e descreva brevemente sua ideia criativa para a campanha.",
        order: 2
      },
      {
        id: 503,
        title: "Uso do Chat Nexa",
        description: "Tire dúvidas e alinhe detalhes diretamente com a marca antes e depois de enviar sua proposta.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 6,
    title: "Produção e Entrega de Conteúdo",
    description: "Boas práticas para produzir, enviar para aprovação e publicar seu conteúdo.",
    audience: "Creator",
    steps: [
      {
        id: 601,
        title: "Produção",
        description: "Siga o roteiro aprovado. Atente-se à iluminação, áudio e qualidade de imagem.",
        order: 1
      },
      {
        id: 602,
        title: "Upload na Plataforma",
        description: "Suba o arquivo de vídeo/foto na aba da campanha para aprovação da marca. NÃO poste antes de aprovar.",
        order: 2
      },
      {
        id: 603,
        title: "Postagem e Comprovação",
        description: "Após aprovado, poste na sua rede social e insira o link da publicação na plataforma para validar a entrega.",
        order: 3
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 9,
    title: "Precificação e Propostas",
    description: "Como definir seu valor e negociar de forma justa e profissional.",
    audience: "Creator",
    steps: [
      {
        id: 901,
        title: "Entenda seu Valor",
        description: "Considere sua produção, tempo, equipamento e o alcance médio de seus conteúdos para cobrar.",
        order: 1
      },
      {
        id: 902,
        title: "Pacotes de Conteúdo",
        description: "Saiba oferecer pacotes (ex: 3 vídeos + 5 fotos) para aumentar o ticket médio de suas parcerias.",
        order: 2
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 10,
    title: "Gestão de Carreira e Portfólio",
    description: "Construa relacionamentos de longo prazo com as marcas e cresça como creator.",
    audience: "Creator",
    steps: [
      {
        id: 1001,
        title: "Manutenção de Perfil",
        description: "Atualize suas métricas e biografia a cada 30 dias para refletir seu crescimento real.",
        order: 1
      },
      {
        id: 1002,
        title: "Feedback e Recorrência",
        description: "Peça feedback após cada job e aproveite para sugerir novas parcerias com as marcas que já atendeu.",
        order: 2
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// ------------------------------------------------------------------
// COMPONENT: DocumentationSidebar (Desktop)
// ------------------------------------------------------------------
function DocumentationSidebar({ sections, activeSection, onSectionChange }: {
  sections: DocSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}) {
  return (
    <div className="hidden md:block fixed top-20 left-0 w-80 bg-background/40 backdrop-blur-md border-r border-white/5 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground/90">
          <BookOpen className="h-5 w-5 text-indigo-500" />
          Guias Oficiais
        </h2>

        <nav className="space-y-1.5 text-[14px]">
          <Button
            variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
            className={`w-full justify-start h-10 transition-all duration-200 ${activeSection === 'overview'
              ? 'bg-indigo-500/10 text-indigo-500 font-bold'
              : 'hover:bg-indigo-500/5'
              }`}
            onClick={() => onSectionChange('overview')}
          >
            <Home className="h-4 w-4 mr-3" />
            Visão Geral
          </Button>

          <Separator className="my-4 opacity-50" />

          {sections.map((section) => {
            // Check if this section is active or if one of its guides is active
            const isSectionActive = activeSection === section.id;
            const hasActiveGuide = section.guides.some(g => `guide-${g.id}` === activeSection);
            const isActive = isSectionActive || hasActiveGuide;

            const isBrand = section.id.startsWith('brand');
            const activeColor = isBrand ? 'indigo' : 'pink';

            return (
              <div key={section.id} className="space-y-1">
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start h-10 transition-all duration-200 ${isActive
                    ? `bg-${activeColor}-500/10 text-${activeColor}-500 font-bold`
                    : 'hover:bg-white/5'
                    }`}
                  onClick={() => onSectionChange(section.id)}
                >
                  <span className={`mr-3 ${isActive ? `text-${activeColor}-500` : 'text-muted-foreground'}`}>
                    {section.icon}
                  </span>
                  <span className="truncate flex-1 text-left">
                    {section.title}
                  </span>
                </Button>

                {(isActive) && section.guides.length > 0 && (
                  <div className={`ml-8 pl-2 border-l border-white/5 mt-1 space-y-1`}>
                    {section.guides.map((guide) => {
                      const isGuideActive = activeSection === `guide-${guide.id}`;
                      return (
                        <Button
                          key={guide.id}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-[13px] h-9 transition-all ${isGuideActive
                            ? `text-${activeColor}-500 font-semibold bg-${activeColor}-500/5`
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                          onClick={() => onSectionChange(`guide-${guide.id}`)}
                        >
                          <ChevronRight className={`h-3 w-3 mr-2 transition-transform ${isGuideActive ? 'rotate-90' : ''}`} />
                          <span className="truncate flex-1 text-left">
                            {guide.title}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: MobileSidebar (Sheet Based)
// ------------------------------------------------------------------
function MobileSidebar({ sections, activeSection, onSectionChange, audience, onAudienceChange }: {
  sections: DocSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  audience: 'overview' | 'Brand' | 'Creator';
  onAudienceChange: (audience: 'overview' | 'Brand' | 'Creator') => void;
}) {
  const [open, setOpen] = useState(false);

  const activeTitle = activeSection === 'overview'
    ? 'Visão Geral'
    : sections.find(s => s.id === activeSection)?.title ||
    sections.find(s => s.guides.some(g => `guide-${g.id}` === activeSection))?.title ||
    'Menu de Navegação';

  return (
    <div className="md:hidden sticky top-15 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 w-full">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-semibold truncate">{activeTitle}</span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 px-3 border-white/10 bg-background/50 hover:bg-white/5 backdrop-blur-md transition-all">
              <MdOutlineLibraryBooks className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 border-r border-white/10 bg-background/95 backdrop-blur-2xl">
            <VisuallyHidden>
              <SheetTitle>Menu de Documentação</SheetTitle>
              <SheetDescription>Navegue pelos guias e categorias</SheetDescription>
            </VisuallyHidden>
            <div className="h-full overflow-y-auto p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-indigo-500" />
                </div>
                <span className="text-lg font-bold">Documentação</span>
              </div>

              <div className="space-y-1">
                <Button
                  variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
                  className={`w-full justify-start h-12 rounded-xl px-4 mb-4 transition-all ${activeSection === 'overview'
                    ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                    : 'text-muted-foreground hover:bg-white/5'
                    }`}
                  onClick={() => { setOpen(false); onSectionChange('overview'); }}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Visão Geral
                </Button>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant={audience === 'Brand' ? 'default' : 'outline'}
                    className={`h-10 text-xs font-bold uppercase tracking-wider ${audience === 'Brand' ? 'bg-indigo-500 hover:bg-indigo-600 border-transparent' : 'border-white/10 hover:bg-white/5'}`}
                    onClick={() => { onAudienceChange('Brand'); }}
                  >
                    🏢 Sou Marca
                  </Button>
                  <Button
                    variant={audience === 'Creator' ? 'default' : 'outline'}
                    className={`h-10 text-xs font-bold uppercase tracking-wider ${audience === 'Creator' ? 'bg-pink-500 hover:bg-pink-600 border-transparent' : 'border-white/10 hover:bg-white/5'}`}
                    onClick={() => { onAudienceChange('Creator'); }}
                  >
                    🎨 Sou Criador
                  </Button>
                </div>

                <div className="pb-2">
                  <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                    Categorias
                  </p>
                </div>

                {sections.map((section) => {
                  const isBrand = section.id.startsWith('brand');
                  const activeColor = isBrand ? 'indigo' : 'pink';
                  const isSectionActive = activeSection === section.id || section.guides.some(g => `guide-${g.id}` === activeSection);

                  return (
                    <div key={section.id} className="mb-2">
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-10 px-4 mb-1 transition-all ${isSectionActive
                          ? `text-${activeColor}-500 font-bold bg-${activeColor}-500/5`
                          : 'text-muted-foreground hover:bg-white/5'
                          }`}
                        onClick={() => { setOpen(false); onSectionChange(section.id); }}
                      >
                        <span className="mr-3">{section.icon}</span>
                        <span className="truncate flex-1 text-left">
                          {section.title}
                        </span>
                      </Button>

                      {isSectionActive && section.guides.length > 0 && (
                        <div className="ml-4 pl-4 border-l border-white/5 space-y-1 mt-1">
                          {section.guides.map((guide) => (
                            <Button
                              key={guide.id}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-xs h-9 ${activeSection === `guide-${guide.id}`
                                ? 'text-foreground font-semibold bg-white/5'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                              onClick={() => { setOpen(false); onSectionChange(`guide-${guide.id}`); }}
                            >
                              <span className="truncate flex-1 text-left">
                                {guide.title}
                              </span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: OverviewContent
// ------------------------------------------------------------------
function OverviewContent() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          Guias da Plataforma Nexa
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Guias completos para marcas e criadores maximizarem o sucesso na plataforma Nexa.
        </p>
      </div>

      {/* Main Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group relative overflow-hidden border-2 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 bg-background/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                <Building2 className="h-6 w-6 text-indigo-500" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Para Marcas</CardTitle>
            </div>
            <CardDescription className="text-base">
              Aprenda a criar campanhas eficazes, gerenciar criadores e maximizar o ROI.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="font-medium">Registro e configuração</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <PlusCircle className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-medium">Criação de campanhas</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-medium">Aprovação de criadores</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                </div>
                <span className="font-medium">Comunicação efetiva</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-2 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 bg-background/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-linear-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-pink-500/10 rounded-xl ring-1 ring-pink-500/20">
                <UserStar className="h-6 w-6 text-pink-500" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Para Criadores</CardTitle>
            </div>
            <CardDescription className="text-base">
              Descubra como otimizar seu perfil, candidatar-se a campanhas e entregar conteúdo de qualidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="font-medium">Registro e perfil</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <PlusCircle className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-medium">Candidatura a campanhas</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="font-medium">Criação de conteúdo</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                </div>
                <span className="font-medium">Comunicação profissional</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quick Checklists */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Checklists Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 bg-background/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl">Para Marcas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm">
                <UserPlus className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Crie sua conta empresarial e complete o perfil</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Wallet className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
                <span>Configure pagamentos e métodos financeiros</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <PlusCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Crie a campanha com briefing e anexos claros</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Aprove criadores e alinhe entregáveis</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>Defina prazos e acompanhe métricas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-background/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5 text-pink-500" />
                <CardTitle className="text-xl">Para Criadores</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm">
                <UserPlus className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Crie conta, verifique contato e complete perfil</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Target className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Use filtros e busque campanhas alinhadas ao seu nicho</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <PlusCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Envie propostas objetivas com orçamento e prazo</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MessageSquare className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>Mantenha comunicação clara e profissional</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Entregue conteúdo conforme briefing e acompanhe resultados</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* FAQ Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border hover:border-indigo-500/30 transition-colors bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como escolher criadores para minha campanha?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Defina o objetivo, público e canais prioritários. Avalie métricas relevantes, portfólio e aderência ao briefing.
            </CardContent>
          </Card>
          <Card className="border hover:border-pink-500/30 transition-colors bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">O que torna uma proposta de criador boa?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Clareza de abordagem, plano de conteúdo, prazo realista e orçamento compatível. Use exemplos do portfólio.
            </CardContent>
          </Card>
          <Card className="border hover:border-pink-500/30 transition-colors bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como melhorar meu perfil de criador?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Complete dados, destaque nicho e públicos, inclua links e métricas recentes de conteúdos relevantes.
            </CardContent>
          </Card>
          <Card className="border hover:border-indigo-500/30 transition-colors bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Como alinhar expectativas de entrega?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Registre objetivos, prazos, revisões e métricas esperadas no briefing. Use a aba de conversas para decisões.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: GuideContent (Detailed View)
// ------------------------------------------------------------------
function GuideContent({ guide }: { guide: Guide }) {
  const [currentScreenshot, setCurrentScreenshot] = useState<{ [stepId: number]: number }>({});
  const steps = useMemo(() => guide.steps ?? [], [guide.steps]);
  const sortedSteps = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);

  const nextScreenshot = (stepId: number, maxIndex: number) => {
    setCurrentScreenshot(prev => ({
      ...prev,
      [stepId]: Math.min((prev[stepId] || 0) + 1, maxIndex - 1)
    }));
  };

  const prevScreenshot = (stepId: number) => {
    setCurrentScreenshot(prev => ({
      ...prev,
      [stepId]: Math.max((prev[stepId] || 0) - 1, 0)
    }));
  };

  const isBrand = guide.audience === 'Brand';
  const accentColor = isBrand ? 'indigo' : 'pink';

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="space-y-6">
        <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${isBrand ? 'bg-indigo-500/10 text-indigo-500' : 'bg-pink-500/10 text-pink-500'
          }`}>
          {isBrand ? 'Para Marcas' : 'Para Criadores'}
        </Badge>
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9]">
            {guide.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
            {guide.description}
          </p>
        </div>
      </div>

      <Separator className="opacity-50" />

      {sortedSteps.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/20 shadow-lg shadow-${accentColor}-500/5`}>
              <PlusCircle className={`h-6 w-6 text-${accentColor}-500`} />
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-tight">Passo a passo</h2>
          </div>

          <div className="space-y-12">
            {sortedSteps.map((step: typeof sortedSteps[number], idx: number) => (
              <Card key={step.id} className="relative overflow-hidden border-2 bg-background/50 backdrop-blur-md group hover:border-white/10 transition-all duration-500 rounded-[2rem] shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                <div className={`absolute top-0 left-0 w-2 h-full bg-${accentColor}-500 opacity-80 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl md:text-4xl font-black opacity-30 text-foreground font-mono tracking-tighter`}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <h3 className="text-xl md:text-2xl font-bold tracking-tight">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                          {step.description}
                        </p>
                      </div>

                      {/* Video if exists - Priority as it's more interactive */}
                      {step.video_url && (
                        <div className="space-y-4 pt-2">
                          <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground/80">
                            <Play className={`h-4 w-4 text-${accentColor}-500`} />
                            VÍDEO TUTORIAL
                          </h4>
                          <div className="relative group/video overflow-hidden rounded-2xl border-2 border-white/5 shadow-2xl bg-black">
                            <video
                              src={step.video_url}
                              controls
                              className="w-full aspect-video"
                            >
                              Seu navegador não suporta vídeos.
                            </video>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Media content - Screenshots */}
                    {step.screenshot_urls && step.screenshot_urls.length > 0 && (
                      <div className="flex-1 space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground/80">
                          <ImageIcon className={`h-4 w-4 text-${accentColor}-500`} />
                          INTERFACE
                        </h4>
                        <div className="relative rounded-2xl overflow-hidden border-2 border-white/5 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.screenshot_urls[currentScreenshot[step.id] || 0]}
                            alt={`${step.title} - Screenshot ${(currentScreenshot[step.id] || 0) + 1}`}
                            className="w-full object-cover"
                          />

                          {step.screenshot_urls.length > 1 && (
                            <div className="absolute inset-x-0 bottom-4 px-4 flex items-center justify-between">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/80"
                                onClick={() => prevScreenshot(step.id)}
                                disabled={(currentScreenshot[step.id] || 0) === 0}
                              >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                              </Button>
                              <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white tracking-widest">
                                {(currentScreenshot[step.id] || 0) + 1} / {step.screenshot_urls.length}
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/80"
                                onClick={() => nextScreenshot(step.id, step.screenshot_urls!.length)}
                                disabled={(currentScreenshot[step.id] || 0) === step.screenshot_urls.length - 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------------
function DocumentationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const audienceParam = searchParams.get('audience');

  const [guides] = useState<Guide[]>(MOCK_GUIDES);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  
  // Derived state from URL
  const activeSection = sectionParam || 'overview';

  const [audience, setAudience] = useState<'overview' | 'Brand' | 'Creator'>(
    audienceParam === 'Brand' || audienceParam === 'Creator' ? (audienceParam as 'Brand' | 'Creator') : 'overview'
  );

  const handleSectionChange = (sectionId: string) => {
    const params = new URLSearchParams();
    params.set('section', sectionId);
    if (audience !== 'overview') params.set('audience', audience);
    router.push(`/docs?${params.toString()}`);
  };

  const brandSections: DocSection[] = [
    {
      id: 'brand-registration',
      title: 'Registro de Marca',
      icon: <UserPlus className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Brand' && (g.title.toLowerCase().includes('registro') || g.title.toLowerCase().includes('financeira')))
    },
    {
      id: 'brand-campaigns',
      title: 'Criação de Campanhas',
      icon: <PlusCircle className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Brand' && (g.title.toLowerCase().includes('campanha') || g.title.toLowerCase().includes('análise')))
    },
    {
      id: 'brand-approval',
      title: 'Aprovação de Criadores',
      icon: <CheckCircle className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Brand' && (g.title.toLowerCase().includes('aprovação') || g.title.toLowerCase().includes('gestão de criadores')))
    },
  ];

  const creatorSections: DocSection[] = [
    {
      id: 'creator-registration',
      title: 'Começando na Nexa',
      icon: <UserPlus className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Creator' && (g.title.toLowerCase().includes('primeiros') || g.title.toLowerCase().includes('cadastro') || g.title.toLowerCase().includes('carreira')))
    },
    {
      id: 'creator-campaigns',
      title: 'Propostas e Campanhas',
      icon: <Target className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Creator' && (g.title.toLowerCase().includes('propostas') || g.title.toLowerCase().includes('precificação')))
    },
    {
      id: 'creator-content',
      title: 'Produção e Entrega',
      icon: <Video className="h-4 w-4" />,
      guides: guides.filter(g => g.audience === 'Creator' && (g.title.toLowerCase().includes('conteúdo') || g.title.toLowerCase().includes('produção')))
    }
  ];

  const sections: DocSection[] = audience === 'Brand' ? brandSections : audience === 'Creator' ? creatorSections : [
    ...brandSections,
    ...creatorSections,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p>Carregando guias...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }

    if (activeSection === 'overview') {
      return <OverviewContent />;
    }

    if (activeSection.startsWith('guide-')) {
      const guideId = parseInt(activeSection.replace('guide-', ''));
      const guide = guides.find(g => g.id === guideId);
      if (guide) {
        return <GuideContent guide={guide} />;
      }
    }

    const section = sections.find(s => s.id === activeSection);
    if (section && section.guides.length > 0) {
      return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              {section.icon}
              {section.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {section.guides.length} guia(s) disponível(is) nesta categoria.
            </p>
          </div>

          <div className="space-y-6">
            {section.guides.map((guide) => (
              <Card key={guide.id} className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-indigo-500/30 group"
                onClick={() => handleSectionChange(`guide-${guide.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {guide.title}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{guide.description}</p>
                  {guide.steps && (
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      {guide.steps.length} passos
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // Default fallback layout for valid section with no guides yet
    if (section && section.guides.length === 0) {
      const isBrand = section.id.startsWith("brand-");
      const title = isBrand ? "Conteúdos essenciais para Marcas" : "Conteúdos essenciais para Criadores";

      return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              EM BREVE
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Estamos preparando conteúdos exclusivos para ajudar você a dominar a plataforma. Fique ligado!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 pointer-events-none grayscale-[0.5]">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Novos guias em produção...</CardTitle>
                <CardDescription>Nossa equipe está finalizando os detalhes.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      );
    }

    return <OverviewContent />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row pt-16 md:pt-20">
      <DocumentationSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <MobileSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        audience={audience}
        onAudienceChange={(val) => {
          setAudience(val);
          handleSectionChange('overview');
        }}
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-500 md:ml-80`}>
        {/* Desktop Tabs */}
        <div className="hidden md:flex sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 items-center justify-between md:rounded-b-[2rem] md:mx-6 md:mt-4 shadow-xl shadow-black/5 ring-1 ring-white/5">
          <Tabs
            value={audience === 'overview' ? 'overview' : audience === 'Brand' ? 'brand' : 'creator'}
            className="w-full max-w-md"
            onValueChange={(val) => {
              if (val === 'overview') {
                setAudience('overview');
                handleSectionChange('overview');
              } else if (val === 'brand') {
                setAudience('Brand');
                handleSectionChange('overview');
              } else if (val === 'creator') {
                setAudience('Creator');
                handleSectionChange('overview');
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-xs uppercase font-bold tracking-wider gap-2"
              >
                <Home className="h-3 w-3" />
                Geral
              </TabsTrigger>
              <TabsTrigger
                value="brand"
                className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-xs uppercase font-bold tracking-wider gap-2"
              >
                🏢 Marcas
              </TabsTrigger>
              <TabsTrigger
                value="creator"
                className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-xs uppercase font-bold tracking-wider gap-2"
              >
                🎨 Criadores
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Badge variant="outline" className="hidden lg:flex px-3 py-1.5 border-white/10 bg-white/5 gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-black tracking-widest opacity-70">Documentação Oficial</span>
          </Badge>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8 pb-24">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function Documentation() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Carregando documentação...</p>
            </div>
          </div>
        }
      >
        <DocumentationInner />
      </Suspense>
    </>
  );
}
