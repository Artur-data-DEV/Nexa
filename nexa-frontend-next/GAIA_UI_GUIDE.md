# Gaia UI - Guia de Estilo e Componentes

**Gaia UI** é o sistema de design utilizado no projeto Nexa. Ele é construído sobre o Tailwind CSS, priorizando acessibilidade, customização e simplicidade.

## Princípios

1.  **Acessibilidade**: Todos os componentes devem seguir as diretrizes WAI-ARIA.
2.  **Composição**: Componentes devem ser pequenos e combináveis.
3.  **Temas**: Suporte nativo a Light/Dark mode via variáveis CSS e Tailwind.

## Tokens de Estilo

Os tokens são definidos no `tailwind.config.ts` e refletidos em variáveis CSS no `globals.css`.

- **Cores**:
    - `primary`: Cor principal da marca.
    - `secondary`: Cor secundária/destaque.
    - `destructive`: Ações de erro/perigo.
    - `muted`: Textos ou fundos secundários.
    - `accent`: Detalhes e focos.
    - `background`: Cor de fundo da página.
    - `foreground`: Cor principal do texto.

- **Espaçamento**: Escala padrão do Tailwind (4px base).

- **Tipografia**: Fontes Sans (Inter/Geist) e Mono.

## Componentes (Exemplos)

Os componentes ficam em `src/presentation/components/ui`.

### Button

```tsx
import { Button } from "@/presentation/components/ui/button"

<Button variant="default" size="lg">
  Clique aqui
</Button>
```

### Input

```tsx
import { Input } from "@/presentation/components/ui/input"

<Input placeholder="Digite seu e-mail" />
```

## Criando Novos Componentes

1.  Use `cva` (class-variance-authority) para gerenciar variantes.
2.  Use `cn` (clsx + tailwind-merge) para mesclar classes.
3.  Exporte o componente com `React.forwardRef` para flexibilidade.

Exemplo de estrutura:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils" // ou path do utilitário

const buttonVariants = cva(
  "classe-base ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ...",
        outline: "border border-input ...",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```
