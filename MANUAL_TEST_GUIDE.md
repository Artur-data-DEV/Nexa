# Guia de Teste Manual: Fluxo Completo Nexa

Este guia descreve os passos para testar o fluxo principal da plataforma, desde a criação de uma campanha até o pagamento e recebimento pelo criador, incluindo a verificação da comissão da plataforma.

## Pré-requisitos

1.  **Dois navegadores** (ou um navegador normal e uma janela anônima) para simular dois usuários simultaneamente:
    *   **Usuário A (Marca):** Quem cria a campanha e paga.
    *   **Usuário B (Criador):** Quem se candidata e entrega o trabalho.
2.  **Contas criadas:**
    *   Uma conta do tipo **Marca** (Brand).
    *   Uma conta do tipo **Criador** (Creator).
3.  **Ambiente de Teste:** Certifique-se de que o backend está rodando e configurado (modo de simulação de pagamento ou Stripe Test Mode).

---

## Passo 1: Criação da Campanha (Marca)

1.  Faça login como **Marca**.
2.  No Dashboard, clique em **"Nova Campanha"** (ou "Criar Campanha").
3.  Preencha o formulário:
    *   **Título:** "Campanha Teste E2E"
    *   **Orçamento:** R$ 100,00 (Para facilitar o cálculo da porcentagem).
    *   **Descrição:** Descrição de teste.
    *   **Requisitos:** Requisitos de teste.
4.  Publique a campanha.
5.  **Verificação:** A campanha deve aparecer na lista "Minhas Campanhas" com status "Ativa" ou "Publicada".

## Passo 2: Candidatura (Criador)

1.  Faça login como **Criador** (em outra janela/navegador).
2.  Vá para **"Campanhas Disponíveis"**.
3.  Localize a "Campanha Teste E2E".
4.  Clique em **"Ver Detalhes"**.
5.  Clique em **"Aplicar"** (ou "Candidatar-se").
6.  Preencha a proposta:
    *   **Valor:** R$ 100,00 (Pode ser igual ou diferente do orçamento, mas use 100 para facilitar).
    *   **Mensagem:** "Tenho interesse nesta campanha."
7.  Envie a proposta.
8.  **Verificação:** O botão deve mudar para "Aplicado" ou similar.

## Passo 3: Aprovação e Contratação (Marca)

1.  Volte para a janela da **Marca**.
2.  Vá para a página de detalhes da campanha ou "Gerenciar Candidatos".
3.  Você deve ver o **Criador** na lista de interessados.
4.  Clique em **"Aprovar"** ou **"Contratar"**.
5.  O sistema deve gerar um **Contrato** (Contract).
6.  O status da campanha/contrato deve mudar para "Aguardando Pagamento" ou "Aguardando Assinatura" (dependendo do fluxo exato).

## Passo 4: Pagamento do Contrato (Marca)

1.  Ainda como **Marca**, vá para a área de pagamentos ou siga o fluxo de contratação.
2.  Realize o pagamento do valor acordado (R$ 100,00).
    *   *Nota:* Se estiver em modo de simulação, o pagamento será aprovado automaticamente. Se for Stripe Test, use os cartões de teste (ex: 4242...).
3.  **Verificação:**
    *   O contrato deve mudar para status **"Ativo"**.
    *   O dinheiro saiu da conta da marca (simbolicamente).

## Passo 5: Execução e Milestones (Criador)

1.  Volte para a janela do **Criador**.
2.  Vá para **"Meus Trabalhos"** ou "Contratos Ativos".
3.  Acesse o contrato da "Campanha Teste E2E".
4.  Verifique se o status está "Ativo".
5.  **Timeline/Milestones:**
    *   Envie um arquivo/link na etapa de "Rascunho" ou "Entrega".
    *   Marque a etapa como concluída.

## Passo 6: Aprovação da Entrega (Marca)

1.  Volte para a janela da **Marca**.
2.  Acesse o contrato.
3.  Analise a entrega do Criador.
4.  Clique em **"Aprovar Entrega"** ou "Finalizar Contrato".

## Passo 7: Encerramento e Pagamento ao Criador

1.  Após a aprovação final da Marca, o contrato deve ser marcado como **"Concluído"**.
2.  O sistema deve processar a liberação do pagamento para o Criador.

## Passo 8: Verificação Financeira e Porcentagem (Ponto Crítico)

1.  Volte para a janela do **Criador**.
2.  Vá para **"Carteira"** ou "Extrato Financeiro".
3.  Verifique o valor recebido.
    *   **Valor do Contrato:** R$ 100,00
    *   **Taxa da Plataforma (10%):** R$ 10,00
    *   **Valor Líquido Esperado:** R$ 90,00
4.  Se o saldo mostrar **R$ 90,00**, o cálculo da comissão está correto.
5.  Verifique se há um registro de transação detalhando a entrada e a taxa.

---

## Resolução de Problemas Comuns

*   **Erro no Upload:** Se houver erro ao enviar arquivos no mobile, verifique se o arquivo é menor que 100MB e se a conexão está estável. Use o modo debug implementado (toast detalhado).
*   **Pagamento não processado:** Verifique os logs do backend (`storage/logs/laravel.log`) para erros de Stripe ou Simulação.
*   **Status não atualiza:** Tente recarregar a página, alguns estados podem não atualizar em tempo real via WebSocket se não estiver configurado.
