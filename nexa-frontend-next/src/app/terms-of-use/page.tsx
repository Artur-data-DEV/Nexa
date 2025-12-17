import { Metadata } from "next";
import { Navbar } from "@/presentation/components/landing/navbar";
import { Footer } from "@/presentation/components/landing/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Separator } from "@/presentation/components/ui/separator";
import { FileText, Shield, Users, CheckCircle2, Scale, Globe } from "lucide-react";
import React from "react";

export const metadata: Metadata = {
  title: "Termos de Uso - NEXA Platform",
  description:
    "Conheça as regras de uso, responsabilidades e condições para utilização da plataforma NEXA por criadores e marcas.",
};

const TermsSection = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="mb-6">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        <CardTitle className="text-xl">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

export default function TermsOfUsePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Termos de Uso</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leia atentamente estes Termos de Uso antes de utilizar a plataforma NEXA. Ao criar uma conta e
              utilizar nossos serviços, você concorda integralmente com as condições abaixo.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">Última atualização: 7 de Outubro de 2025</div>
          </div>

          <Separator className="mb-8" />

          <TermsSection icon={FileText} title="1. Aceitação dos Termos">
            <p className="text-muted-foreground leading-relaxed">
              Ao se cadastrar e utilizar a plataforma NEXA, você declara ter lido, compreendido e aceito estes
              Termos de Uso, bem como a Política de Privacidade aplicável. Caso não concorde com qualquer condição
              prevista neste documento, você não deve utilizar a Plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos se aplicam a todos os usuários, incluindo criadores de conteúdo, marcas, administradores
              e demais visitantes da plataforma.
            </p>
          </TermsSection>

          <TermsSection icon={Users} title="2. Elegibilidade e Cadastro">
            <p className="text-muted-foreground leading-relaxed">
              O uso da NEXA é permitido apenas para pessoas físicas ou jurídicas com capacidade plena para exercer
              atos da vida civil, conforme a legislação brasileira.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Você se compromete a fornecer dados verdadeiros, completos e atualizados no momento do cadastro.</li>
              <li>• É de sua responsabilidade manter a confidencialidade de login e senha.</li>
              <li>• Qualquer atividade realizada por meio da sua conta será considerada de sua responsabilidade.</li>
              <li>
                • A NEXA poderá suspender ou encerrar contas em caso de informações falsas, uso indevido ou
                descumprimento destes Termos.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Shield} title="3. Uso da Plataforma">
            <p className="text-muted-foreground leading-relaxed">
              A NEXA conecta marcas e criadores para execução de campanhas de conteúdo, incluindo, mas não se
              limitando, a campanhas UGC, influenciadores e ações promocionais.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• É proibido utilizar a plataforma para fins ilegais, ilícitos ou em desacordo com a legislação.</li>
              <li>
                • É vedada a publicação de conteúdo que viole direitos de terceiros, incluindo direitos autorais, de
                imagem, honra, privacidade ou propriedade intelectual.
              </li>
              <li>
                • Não é permitido disseminar discurso de ódio, discriminação, violência, conteúdo sexual explícito ou
                qualquer material que possa ser considerado ofensivo ou inadequado.
              </li>
              <li>
                • A NEXA poderá remover conteúdos e suspender usuários que descumprirem estas regras, sem prejuízo de
                outras medidas legais.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={CheckCircle2} title="4. Relação entre Marcas e Criadores">
            <p className="text-muted-foreground leading-relaxed">
              A NEXA atua como plataforma intermediadora entre marcas e criadores, facilitando a conexão e gestão de
              campanhas, sem que isso caracterize vínculo empregatício, sociedade ou representação entre as partes.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Marcas são responsáveis pelas informações fornecidas nos briefings e campanhas.</li>
              <li>• Criadores são responsáveis pela execução das entregas contratadas, conforme os prazos acordados.</li>
              <li>
                • A comunicação entre as partes deve ocorrer de forma profissional, respeitosa e dentro da plataforma,
                sempre que possível.
              </li>
              <li>
                • A NEXA não se responsabiliza pelo resultado final das campanhas, mas pode intervir em casos de
                descumprimento grave, conforme sua política interna.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Scale} title="5. Pagamentos, Remuneração e Tributos">
            <p className="text-muted-foreground leading-relaxed">
              Quando houver remuneração financeira, os pagamentos aos criadores serão processados conforme regras
              definidas na própria plataforma ou em contratos específicos.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Os valores, prazos e condições de pagamento serão informados em cada campanha.</li>
              <li>• Podem ser aplicadas taxas de serviço da plataforma, conforme divulgado aos usuários.</li>
              <li>
                • Cada parte é responsável pelo recolhimento de tributos incidentes sobre suas atividades, incluindo
                impostos, contribuições e demais encargos fiscais.
              </li>
              <li>
                • A NEXA poderá solicitar dados bancários, fiscais e cadastrais para cumprimento de obrigações legais
                e regulatórias.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Globe} title="6. Propriedade Intelectual e Licenças de Uso">
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, marcas, logotipos, layout e funcionalidades da plataforma NEXA são de propriedade
              exclusiva da NEXA ou licenciados a ela, sendo protegidos por leis de direitos autorais e propriedade
              intelectual.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Ao participar de campanhas, o criador poderá conceder à marca e à NEXA licenças de uso sobre os
                conteúdos produzidos, conforme descrito em cada campanha ou contrato específico.
              </li>
              <li>
                • É proibida a reprodução, modificação ou exploração comercial não autorizada de qualquer parte da
                plataforma.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Shield} title="7. Privacidade e Proteção de Dados">
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de dados pessoais na NEXA é regido pela Política de Privacidade, elaborada em conformidade
              com a LGPD e demais normas aplicáveis.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ao aceitar estes Termos, você também declara ciência e concordância com nossa Política de Privacidade,
              que detalha como coletamos, utilizamos e protegemos suas informações.
            </p>
          </TermsSection>

          <TermsSection icon={FileText} title="8. Suspensão, Encerramento e Alterações">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • A NEXA poderá suspender ou encerrar contas em caso de violação destes Termos, conduta abusiva ou
                suspeita de fraude.
              </li>
              <li>
                • Você poderá encerrar sua conta a qualquer momento, respeitadas obrigações pendentes, como campanhas
                em andamento ou pagamentos devidos.
              </li>
              <li>
                • A NEXA poderá atualizar estes Termos de Uso periodicamente, sendo recomendada a leitura regular da
                versão mais recente.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Scale} title="9. Limitação de Responsabilidade">
            <p className="text-muted-foreground leading-relaxed">
              A NEXA envida esforços razoáveis para manter a plataforma segura, estável e disponível, mas não garante
              funcionamento ininterrupto ou livre de falhas.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • A NEXA não se responsabiliza por danos indiretos, lucros cessantes ou perdas de oportunidade
                decorrentes do uso da plataforma.
              </li>
              <li>
                • A responsabilidade da NEXA, quando aplicável, será limitada ao valor total efetivamente pago à
                plataforma pelo usuário nos últimos 12 meses.
              </li>
            </ul>
          </TermsSection>

          <TermsSection icon={Globe} title="10. Disposições Gerais e Foro">
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer controvérsia
              decorrente da utilização da plataforma será submetida ao foro da comarca de domicílio do usuário, salvo
              disposição legal em contrário.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Caso qualquer disposição destes Termos seja considerada inválida ou inexequível, as demais permanecerão
              em pleno vigor e efeito.
            </p>
          </TermsSection>
        </div>
      </main>

      <Footer />
    </>
  );
}

