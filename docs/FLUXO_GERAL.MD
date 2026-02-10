# Fluxo Detalhado do Chat (com Status e Substatus)

A proposta é que o chat represente **todas as etapas da campanha**, funcionando como um acompanhamento visual do progresso do trabalho, desde a **aprovação do criador** até o **pagamento final**.

Cada campanha dentro do chat possui **etapas claras**, e cada etapa possui **status e substatus**, que mostram exatamente em que ponto o trabalho está.

---

## 1. Contratação do Criador

**Status:** Aprovado  
**Substatus possíveis:**
- Aprovado  
- Rejeitado  

**Como funciona:**
- A marca aprova o criador para a campanha.  
- Somente após essa aprovação o chat é ativado oficialmente e passa a representar o acordo entre as partes.

---

## 2. Alinhamento Inicial e Logística

**Status:** Aguardando Preparação  
**Substatus possíveis:**
- Material Enviado  
- Produto Enviado  
- Produto Recebido  

**Como funciona:**
- A marca envia briefing, materiais ou produtos físicos, se necessário.  
- O criador confirma o recebimento diretamente no chat.

📌 **Regra importante:**  
O prazo de produção do criador **só começa** após o substatus **“Produto Recebido”** ou **“Material Enviado”**, evitando atrasos injustos.

---

## 3. Criação do Roteiro / Proposta de Conteúdo

**Status:** Aguardando Roteiro  
**Substatus possíveis:**
- Roteiro Enviado  
- Aprovado  
- Ajuste Solicitado  

**Como funciona:**
- O criador envia o roteiro ou proposta inicial pelo chat.  
- A marca pode:
  - Aprovar  
  - Solicitar ajustes (o status retorna para o criador)

Todo esse vai-e-volta fica registrado como status, evitando dúvidas do tipo **“quem está devendo?”**.

---

## 4. Produção do Conteúdo

**Status:** Aguardando Produção  
**Substatus possíveis:**
- Conteúdo Enviado  
- Em Revisão  
- Ajuste Solicitado  

**Como funciona:**
- Com o roteiro aprovado, o criador grava e envia o conteúdo final.  
- A marca revisa e pode aprovar ou pedir ajustes, dentro de um número limitado de revisões.

📌 Isso evita ciclos infinitos de correção.

---

## 5. Aprovação Final

**Status:** Aguardando Aprovação  
**Substatus possíveis:**
- Aprovado  
- Aprovado com Ressalvas  

**Como funciona:**
- A marca aprova oficialmente a entrega final.  
- Caso não haja resposta dentro do prazo combinado, o sistema pode considerar a entrega como **aprovada automaticamente**.

---

## 6. Pagamento

**Status:** Aguardando Pagamento  
**Substatus possíveis:**
- Pagamento Pendente  
- Pagamento Processado  
- Pagamento Liberado  

**Como funciona:**
- Após a aprovação final:
  - O pagamento é processado  
  - A plataforma retém sua taxa  
  - O valor do criador é liberado  

📌 O pagamento **só acontece após aprovação registrada no chat**.

---

## 7. Encerramento da Campanha

**Status:** Encerrado  
**Substatus possíveis:**
- Contrato Fechado  
- Arquivado  

**Como funciona:**
- A campanha é concluída.  
- O chat pode:
  - Ser exportado (diretoria ou controle interno)  
  - Ser encerrado e ocultado da lista principal de chats  

📌 O histórico permanece salvo, mas o chat não fica ativo para novas interações.

---

## Visão Geral da Lógica

- Cada etapa tem um responsável claro  
- Nenhuma entrega acontece sem registro  
- Nenhum pagamento acontece sem aprovação  
- Todo o histórico fica documentado  

➡️ O chat deixa de ser informal e vira um **fluxo organizado de trabalho**.

# Proposta Comercial e Termo Aditivo – Fase 2 da Plataforma Nexa

---

## PARTE I: PROPOSTA COMERCIAL

### 1. Objetivo Estratégico

Esta proposta formaliza o escopo técnico e comercial para a **Fase 2** da plataforma Nexa, focada na implementação de seu **fluxo de chat transacional**. O objetivo é evoluir a plataforma de vitrine com ferramenta de comunicação para um **marketplace operacional completo**, onde o ciclo de vida de uma campanha — da negociação ao pagamento — é executado, registrado e auditado.

A implementação deste módulo é um passo fundamental para a **monetização segura** da plataforma, estabelecendo um ambiente com regras de negócio claras que minimizam disputas e garantem a conformidade das entregas entre Marcas e Criadores de Conteúdo.

### 2. Arquitetura da Solução e Funcionalidades

O chat será o centro da governança contratual, centralizando as seguintes funcionalidades:

| Funcionalidade | Descrição Técnica |
| :--- | :--- |
| **Gestão de Entregas (Milestones)** | Sistema para submissão de entregas por etapas, com suporte a conteúdos digitais (imagens, PDFs, links) e confirmação manual de recebimento de produtos/serviços. |
| **Notificações Transacionais** | Alertas automáticos de status para garantir que ambas as partes sejam notificadas sobre ações críticas (ex: aprovação, pagamento, solicitação de ajuste). |
| **Ciclo de Aprovação Integrado** | Mecanismo para aprovação ou solicitação de ajustes diretamente no chat, com um limite de rodadas de revisão a ser parametrizado. |
| **Registro de Auditoria (Audit Log)** | Geração de um histórico completo e imutável de todas as ações, mensagens e arquivos, servindo como evidência contratual. |
| **Encerramento e Exportação** | Funcionalidade para o encerramento formal do contrato e a exportação do histórico completo do chat em formato legível. |

### 3. Fluxo de Trabalho Operacional (Milestones)

O fluxo foi desenhado para garantir visibilidade e previsibilidade, com regras de negócio para evitar a inatividade dos projetos.

| Etapa | Status Principal | Sub-Status | Regra de Negócio Associada |
| :--- | :--- | :--- | :--- |
| 1. **Contratação** | Aprovada | `Aprovada`, `Rejeitada` | A Marca aprova a participação do Criador na campanha. |
| 2. **Alinhamento e Logística** | Aguardando Preparação | `Material Enviado`, `Produto Enviado`, `Produto Recebido` | O prazo do Criador inicia-se somente após a confirmação de recebimento dos insumos necessários (físicos ou digitais). |
| 3. **Criação (Roteiro/Esboço)** | Aguardando Roteiro | `Enviado`, `Aprovado`, `Ajuste Solicitado` | A Marca possui um prazo definido para aprovar ou solicitar ajustes, sob pena de aprovação tácita. |
| 4. **Produção do Conteúdo** | Aguardando Produção | `Enviado`, `Em Revisão`, `Ajuste Solicitado` | Limite de rodadas de ajuste por entrega para garantir a finalização do trabalho. |
| 5. **Aprovação Final** | Aguardando Aprovação | `Aprovado`, `Aprovado com Ressalvas` | A ausência de manifestação da Marca no prazo estipulado resulta na aprovação automática da entrega. |
| 6. **Pagamento** | Aguardando Pagamento | `Pendente`, `Processado`, `Liberado` | O pagamento da etapa é condicionado à sua aprovação formal. |
| 7. **Finalização** | Encerrado | `Contrato Fechado`, `Arquivado` | O histórico é preservado para auditoria, e o chat é ocultado da interface principal. |

> **Nota sobre Logística:** A gestão de entregas físicas será baseada em **confirmação manual** no chat. A responsabilidade pelo acompanhamento do frete é das partes (Marca/Criador), enquanto a plataforma se responsabiliza por registrar a confirmação de envio e recebimento como evidência.

### 4. Condições Comerciais e Cronograma

| Item | Detalhes |
| :--- | :--- |
| **Valor do Investimento** | **R$ 1.822,22**  |
| **Forma de Cobrança** | Pagamento único, referente à implementação integral do escopo desta proposta. |
| **Prazo de Implementação** | **3 (três) semanas** a partir da assinatura do Termo Aditivo. |

**Cronograma de Execução:**

*   **Semana 1:** Mapeamento final do fluxo, modelagem de dados e prototipação da interface.
*   **Semana 2:** Implementação do ciclo de submissão, aprovação, revisões e sistema de notificações.
*   **Semana 3:** Integração do sistema de pagamento condicional, funcionalidade de encerramento e testes de ponta a ponta.

---

## PARTE II: TERMO ADITIVO CONTRATUAL

### TERMO ADITIVO Nº 01 AO CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TI

**Pelo presente instrumento, as partes:**

**CONTRATANTE:** **ACADEMIA UGC LTDA**, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 58.033.639/0001-53, com sede na AV PAU BRASIL LOTE 06, EDIF E-BUSINESS, LOJA 02, ÁGUAS CLARAS NORTE, CEP 71.916-500, neste ato representada por sua Sócia Administradora, Sra. Marisa Nasser da Cruz.

**CONTRATADO:** **ARTUR CAMPOS BATISTA DE SENNA FREITAS**, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 64.658.889/0001-81, com sede na Quadra QNL 6, Bloco G, Casa 15, Taguatinga Norte, Brasília/DF, CEP 72155-617.

Resolvem, de comum acordo, aditar o **Contrato de Prestação de Serviços de TI** firmado em 23 de janeiro de 2026, nos termos que se seguem:

**CLÁUSULA PRIMEIRA – DO OBJETO**

1.1. Fica acrescido ao escopo do contrato principal a **implementação da Fase 2 da Plataforma Nexa**, consistente no desenvolvimento do **Fluxo Operacional de Chat e Gestão de Milestones**, conforme detalhado na Proposta Comercial (Parte I) deste documento, que passa a ser considerado Anexo Técnico.

**CLÁUSULA SEGUNDA – DO VALOR E DA FORMA DE PAGAMENTO**

2.1. Pela execução dos serviços descritos neste aditivo, a CONTRATANTE pagará ao CONTRATADO o valor total, fixo e único de **R$ 1.822,22**.

2.2. O referido pagamento será realizado de forma independente e não se confunde com as parcelas estabelecidas no cronograma financeiro do contrato principal.

**CLÁUSULA TERCEIRA – DO PRAZO**

3.1. O prazo para a conclusão e entrega das funcionalidades objeto deste termo é de **3 (três) semanas**, contadas a partir da data de assinatura deste instrumento.

**CLÁUSULA QUARTA – DA RATIFICAÇÃO**

4.1. Ficam ratificadas todas as demais cláusulas e condições do contrato original que não conflitem com as disposições do presente Termo Aditivo, em especial as que tratam de **Propriedade Intelectual, Confidencialidade e o Foro da Comarca de Taguatinga, Distrito Federal**.

E, por estarem justas e contratadas, assinam o presente termo em 2 (duas) vias de igual teor e forma.

Brasília/DF, [Inserir Data].


---

**ACADEMIA UGC LTDA**
(Contratante)


---

**ARTUR CAMPOS BATISTA DE SENNA FREITAS**
(Contratado)