import { Metadata } from "next";
import { Navbar } from "@/presentation/components/landing/navbar";
import { Footer } from "@/presentation/components/landing/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Separator } from "@/presentation/components/ui/separator";
import { FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { TERMS_CONTENT } from "@/presentation/components/terms/terms-content";

export const metadata: Metadata = {
  title: "Termos Gerais de Uso - NEXA",
  description:
    "Termos gerais de uso da plataforma NEXA e da prestacao de servicos de gerenciamento e criacao de campanhas publicitarias.",
};

export default function TermsOfUsePage() {
  const terms = TERMS_CONTENT.brand_campaign_creation;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Termos Gerais de Uso</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Leia atentamente os termos da plataforma NEXA antes de utilizar os servicos.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">Ultima atualizacao: 17 de fevereiro de 2026</div>
          </div>

          <Separator className="mb-8" />

          <Card>
            <CardHeader>
              <CardTitle>{terms.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="contract-terms text-sm md:text-base max-w-none">
                <ReactMarkdown>{terms.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}
