"use client"

import Link from "next/link"
import { useTheme } from "next-themes"

export const Footer = () => {
  const { theme } = useTheme()

  return (
    <footer className="bg-background text-foreground py-8 md:py-12 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="text-xl md:text-2xl font-bold mb-4">
                 <img 
                    src={theme === 'dark' ? "/assets/light-logo.png" : "/assets/dark-logo.png"} 
                    alt="NEXA UGC" 
                    width={90} 
                    className="w-30 h-10" 
                 />
            </div>
            <p className="text-gray-400 text-sm">
              Construindo o maior ecossistema de UGC da América Latina, uma parceria autêntica por vez.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links Básicos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer hover:text-primary transition-colors">
                Sobre a NEXA
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Como funciona
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Preços e planos
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Cases de sucesso
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Blog e recursos
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suporte Profissional</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer hover:text-primary transition-colors">
                Central de atendimento
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Contato comercial
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Status da plataforma
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Reportar problemas
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Agendamento de calls
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Compliance e Segurança</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="cursor-pointer hover:text-primary transition-colors">
                Termos de uso
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="hover:text-primary transition-colors"
                >
                  Política de privacidade
                </Link>
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Política de cookies
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                LGPD
              </li>
              <li className="cursor-pointer hover:text-primary transition-colors">
                Certificações
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-sm text-gray-400">
          © 2025 NEXA. Todos os direitos reservados. | CNPJ: XX.XXX.XXX/0001-XX
        </div>
      </div>
    </footer>
  )
}
