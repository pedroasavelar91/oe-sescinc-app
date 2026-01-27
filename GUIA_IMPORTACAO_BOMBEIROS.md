# Guia de Importação em Massa de Bombeiros

Para subir 1600 linhas de bombeiros, a maneira mais segura e rápida é utilizando o painel do Supabase.

## Passo 1: Preparar a Planilha
Utilize o arquivo `template_bombeiros.csv` que criei na raiz do projeto como base.

### Regras das Colunas:
1. **name**: Nome completo (Texto).
2. **cpf**: Formato `000.000.000-00` ou apenas números (Texto).
3. **base**: Sigla da base, ex: `SBGR` (Texto).
4. **region**: Deve ser exatamente entre: `Norte`, `Nordeste`, `Centro-Oeste`, `Sudeste`, `Sul`.
5. **airport_class**: Deve ser algarismo romano: `I`, `II`, `III` ou `IV`.
6. **graduation_date**: Data no formato ISO `AAAA-MM-DD` (Ex: 2023-12-31).
7. **last_update_date**: Data no formato ISO `AAAA-MM-DD`.
8. **last_fire_exercise_date**: Data ISO (Obrigatório apenas se Classe IV, senão deixe vazio).
9. **is_not_updated**: `TRUE` ou `FALSE`. (Marque TRUE se o cadastro for antigo e precisar de revisão).
10. **is_away**: `TRUE` ou `FALSE` (Se está afastado).
11. **away_reason**: Texto (Opcional).

## Passo 2: Importar no Supabase
1. Acesse o painel do seu projeto no Supabase.
2. Vá para **Table Editor** (ícone de tabela na barra lateral).
3. Selecione a tabela **firefighters**.
4. Clique no botão **Insert** -> **Import Data from CSV**.
5. Arraste seu arquivo CSV.
6. Verifique se as colunas foram reconhecidas corretamente (o Supabase tenta mapear automaticamente).
    - Certifique-se de que `cpf` mapeie para `cpf`.
    - Certifique-se de que `graduation_date` mapeie para `graduation_date` (e não timestamp), etc.
7. Clique em **Import**.

## Dica Importante
Faça um teste subindo apenas 5 linhas primeiro para garantir que os formatos de data e booleanos estão passando corretamente sem erros.
