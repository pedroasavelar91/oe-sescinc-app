# 🧪 Plano de Testes - Correção de Schema

## ✅ Pré-requisitos Concluídos
- [x] Script SQL executado no Supabase
- [x] Mapeadores criados em `services/dataMappers.ts`
- [x] AppStore.tsx atualizado com mapeadores
- [x] Servidor de desenvolvimento iniciado

## 📋 Testes a Realizar

### 1. Teste de Criação de Estudante
**Objetivo:** Verificar se dados de estudantes são salvos corretamente

**Passos:**
1. Abra a aplicação no navegador
2. Faça login (se necessário)
3. Navegue até a página de Estudantes
4. Clique em "Adicionar Estudante"
5. Preencha todos os campos obrigatórios
6. Salve o estudante
7. **Recarregue a página (F5)**
8. ✅ Verifique se o estudante ainda aparece na lista

**Console:** Não deve haver erros de "column does not exist"

---

### 2. Teste de Criação de Turma
**Objetivo:** Verificar persistência de turmas

**Passos:**
1. Navegue até "Turmas"
2. Crie uma nova turma
3. Preencha nome, datas, curso, etc.
4. Salve
5. **Recarregue a página (F5)**
6. ✅ Verifique se a turma persiste

---

### 3. Teste de Criação de Bombeiro (CRÍTICO)
**Objetivo:** Verificar se a nova estrutura da tabela `firefighters` funciona

**Passos:**
1. Navegue até "Bombeiros"
2. Adicione um novo bombeiro
3. Preencha todos os campos:
   - Nome, Base, Região
   - Classe do Aeroporto
   - Data de Formação
   - Data de Última Atualização
   - Status de afastamento (se aplicável)
4. Salve
5. **Recarregue a página (F5)**
6. ✅ Verifique se o bombeiro aparece com TODOS os dados

**Campos críticos a verificar:**
- `graduationDate` (Data Formação)
- `lastUpdateDate` (Última Atualização)
- `airportClass` (Classe Aeroporto)
- `region` (Região)
- `isAway` (Status afastamento)

---

### 4. Teste de Tarefas
**Objetivo:** Verificar mapeamento de tarefas

**Passos:**
1. Crie uma nova tarefa
2. Atribua a alguém
3. Defina prazo e prioridade
4. Salve
5. **Recarregue (F5)**
6. ✅ Tarefa deve persistir com todos os dados

---

### 5. Verificação do Console
**Durante TODOS os testes acima:**

**Abra o DevTools (F12) → Console**

**❌ NÃO deve aparecer:**
- `column "graduation_date" does not exist`
- `column "last_update_date" does not exist`
- `column "airport_class" does not exist`
- `column "is_away" does not exist`
- Qualquer erro de SQL

**✅ DEVE aparecer:**
- Logs de `syncWithSupabase` com sucesso
- Mensagens de fetch bem-sucedido

---

## 🔍 Verificação no Supabase

Após os testes, verifique diretamente no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Abra a tabela `firefighters`
4. ✅ Verifique se as colunas existem:
   - `base`
   - `region`
   - `airport_class`
   - `graduation_date`
   - `last_update_date`
   - `is_not_updated`
   - `is_away`
   - `away_start_date`
   - `away_end_date`
   - `away_reason`

5. Verifique se os dados inseridos aparecem corretamente
### Erro: "column does not exist"
- **Causa:** Script SQL não executou corretamente
- **Solução:** Re-execute o `supabase-schema-fix.sql`

### Dados não persistem
- **Causa:** Mapeadores não estão sendo usados
- **Solução:** Verifique se o import está correto no `AppStore.tsx`

### Campos aparecem como `null`
- **Causa:** Mapeamento incorreto
- **Solução:** Verifique `services/dataMappers.ts`

---

## 🎯 Resultado Esperado

✅ **SUCESSO:** Todos os dados criados devem:
1. Ser salvos no Supabase
2. Persistir após reload da página
3. Aparecer corretamente no Table Editor
4. Não gerar erros no console
