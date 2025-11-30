# Como Corrigir o Erro do GlobalStore.tsx

## O Problema

O Git no Windows não conseguiu detectar que renomeamos `Store.tsx` para `GlobalStore.tsx` porque o Windows não diferencia maiúsculas de minúsculas. Por isso, o arquivo `GlobalStore.tsx` não está no GitHub, mesmo que você tenha feito push.

## Solução Passo a Passo

### Opção 1: Usando o VS Code (Mais Fácil)

1. **Abra o Terminal do VS Code** (Menu `Terminal` -> `Novo Terminal`)

2. **Cole estes comandos, um por vez:**

   ```bash
   git rm --cached context/Store.tsx
   ```
   *(Este comando remove o arquivo antigo do rastreamento do Git)*

3. Depois, adicione o novo arquivo:
   ```bash
   git add context/GlobalStore.tsx
   ```

4. Faça o commit:
   ```bash
   git commit -m "Fix: Add GlobalStore.tsx correctly"
   ```

5. Envie para o GitHub:
   ```bash
   git push
   ```

### Opção 2: Se o Git não funcionar no terminal

Se os comandos acima não funcionarem, faça assim:

1. **Deletar o arquivo do Git manualmente:**
   - Vá na aba **Source Control** (ícone de ramificação na barra lateral esquerda)
   - Procure pelo arquivo `context/Store.tsx` na lista de arquivos
   - Se ele aparecer, delete-o temporariamente do seu projeto (você pode deletar e recriar depois)

2. **Renomear temporariamente:**
   - Renomeie a pasta `context` para `context_temp`
   - Faça commit e push dessa mudança
   - Renomeie de volta `context_temp` para `context`
   - Faça commit e push novamente

### Opção 3: Recriar o arquivo com nome diferente (Mais Garantido)

1. **Renomeie `GlobalStore.tsx` para `AppStore.tsx`**:
   - No explorador de arquivos, clique com o botão direito em `context/GlobalStore.tsx`
   - Selecione `Rename` e mude para `AppStore.tsx`

2. **Atualize TODOS os imports** (eu farei isso para você se escolher esta opção - apenas me avise)

3. **Commit e Push**:
   - Vá na aba Source Control
   - Adicione todos os arquivos (botão `+` ao lado de "Changes")
   - Digite uma mensagem: "Fix: Rename to AppStore.tsx"
   - Clique em `Commit`
   - Clique em `Sync Changes` ou `Push`

## Qual opção você prefere?

Me diga qual opção você quer tentar e eu te ajudo com os próximos passos!
