# Painel do Diagnóstico Situacional da Rede de Atenção às Urgências — Goiás

Aplicação web institucional para a Secretaria de Estado da Saúde de Goiás,
consolidando as respostas do Google Forms "DIAGNÓSTICO SITUACIONAL" em
indicadores, gráficos e tabelas sobre a Rede de Atenção às Urgências do
Estado, com atualização automática a cada nova resposta.

> **Antes de publicar**, leia `docs/identidade-visual.md` (paleta oficial e a
> decisão de não usar o Brasão Oficial no cabeçalho) e
> `docs/integracao-google-forms.md` (configuração da fonte de dados e do
> gatilho de atualização automática).

## Visão geral técnica

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router.
- **Gráficos**: Recharts.
- **Backend**: Netlify Functions (`netlify/functions/dados.ts` e
  `revalidar.ts`), reaproveitando a mesma camada de transformação usada em
  desenvolvimento local (`src/lib/pipeline.ts`).
- **Fonte de dados**: Planilha Google publicada em CSV (ver
  `docs/integracao-google-forms.md`).
- **Sem dependência de banco de dados ou serviços pagos** para esta primeira
  versão.

## Estrutura do projeto

```
src/
  components/     Cabeçalho, filtros, busca avançada, tabela, gráficos
  pages/          10 páginas temáticas do painel
  lib/            Limpeza, transformação, indicadores, dicionário de dados,
                  paleta de cores, navegação
  types/          Contratos TypeScript compartilhados
  hooks/          useDataset (fetch + atualização automática)
  context/        Estado global de filtros
netlify/functions/  Netlify Functions (produção)
scripts/            Gerador do dicionário de dados + planilha de referência
docs/               Dicionário de dados, metodologia, identidade visual,
                    integração com Google Forms
tests/              Testes com Vitest (limpeza, transformação, indicadores)
```

## Instalação e execução local

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Sem `GOOGLE_SHEETS_CSV_URL` configurada, o
ambiente local usa automaticamente a planilha de referência
(`scripts/fixtures/planilha-referencia.csv`, com as mesmas 172 respostas
usadas para desenvolver e validar este projeto) — não é necessário nenhum
segredo para rodar o painel localmente.

**O painel já está conectado à planilha real do Google Forms** ("DIAGNÓSTICO
SITUACIONAL (respostas)") — para usar a fonte ao vivo em vez da planilha de
referência, copie `.env.example` para `.env` (a URL já vem preenchida) e rode
`npm run dev` novamente. Em produção (Netlify), configure a mesma variável em
**Site settings → Environment variables**. Ver `docs/integracao-google-forms.md`
para detalhes da verificação feita e um aviso importante sobre o
compartilhamento da planilha.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento (Vite + middleware `/api/dados` local) |
| `npm run build` | Verificação de tipos + build de produção (`dist/`) |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Verificação de tipos TypeScript, sem build |
| `npm test` | Roda a suíte de testes (Vitest) |
| `npm run test:watch` | Testes em modo observação |
| `npm run importar-planilha` | Reexecuta o gerador do dicionário de dados a partir da planilha de referência |
| `npm run build:demo` | Gera `dist-demo/index.html`, um único arquivo HTML autocontido (sem backend) com um instantâneo real das 172 respostas, para pré-visualização offline — ver "Pré-visualização offline" abaixo |

### Pré-visualização offline (sem instalar nada)

Se você só quer **ver** o painel funcionando com dados reais, sem configurar
Netlify, variáveis de ambiente ou banco de dados: rode `npm run build:demo` e
abra `dist-demo/index.html` diretamente no navegador (duplo clique). É a
mesma interface, navegável por completo, com o instantâneo real das 172
respostas da planilha de referência — só não atualiza automaticamente (o
cabeçalho mostra um aviso de "demonstração estática offline").

## Testes e validação da base

```bash
npm test
```

A suíte cobre limpeza de dados (carimbo, CNES, valores mistos, expressões de
ausência), a transformação completa da planilha de referência real (172
respostas) e os indicadores agregados. Os testes de transformação validam
números específicos da base analisada — 144 municípios, 168 CNES distintos, 4
CNES duplicados, 2 respostas com a categoria residual "Opção 8", Goiânia com 12
respostas e Senador Canedo com 4 — funcionando como regressão contra a
metodologia documentada em `docs/metodologia.md`.

## Publicação no Netlify

1. Suba este repositório para o GitHub.
2. No Netlify: **Add new site → Import an existing project**, conecte o
   repositório. O `netlify.toml` já configura build (`npm run build`),
   diretório de publicação (`dist`) e as funções serverless.
3. Em **Site settings → Environment variables**, configure no mínimo
   `GOOGLE_SHEETS_CSV_URL` (ver `docs/integracao-google-forms.md`). Opcional:
   `REVALIDATE_TOKEN`, `VITE_SYNC_INTERVAL_MS`.
4. Cada push na branch principal gera um novo deploy automaticamente após
   build bem-sucedido — mas **novas respostas do Google Forms aparecem no
   painel sem precisar de novo deploy**, graças à Netlify Function.
5. (Opcional, recomendado) Configure o gatilho `onFormSubmit` do Google Apps
   Script apontando para `/api/revalidar` — ver
   `docs/integracao-google-forms.md`.

## Documentação

- [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md) — as 123
  colunas analíticas mapeadas a eixo, indicador, tipo, unidade, regra de
  limpeza e visualização (gerado por `scripts/gerar-dicionario.py`).
- [`docs/metodologia.md`](docs/metodologia.md) — regras de limpeza,
  deduplicação de CNES, tratamento de valores extremos, fórmulas dos
  indicadores e regras dos semáforos.
- [`docs/identidade-visual.md`](docs/identidade-visual.md) — paleta oficial,
  paleta de visualização de dados (e por que o amarelo institucional não é
  usado em gráficos), e a pendência do Brasão Oficial.
- [`docs/integracao-google-forms.md`](docs/integracao-google-forms.md) —
  configuração da fonte de dados, cache/revalidação e atualização automática.

## Pendências institucionais antes da publicação definitiva

Estas decisões dependem da Secretaria de Estado da Saúde de Goiás e não foram
tomadas pela IA que gerou este código (ver também a seção 3 do prompt mestre
original):

1. **Brasão Oficial**: removido do cabeçalho a pedido da responsável pelo
   projeto — o painel usa apenas as cores oficiais (ver
   `docs/identidade-visual.md`). Se a Secretaria decidir reintroduzi-lo, ver
   as fontes institucionais listadas nesse mesmo documento.
2. **Nível de acesso**: confirmado como **público** para esta versão — o
   painel já foi construído com anonimização completa (sem nome do
   responsável pelo preenchimento, sem exposição da planilha bruta). Se a
   decisão mudar para acesso restrito, será necessário adicionar uma camada de
   autenticação (não incluída nesta v1).
3. **Metas e faixas de alerta**: nenhuma meta clínica/administrativa foi
   inventada — os semáforos usam apenas classificações descritivas. Definir
   metas com as áreas técnicas antes de ativar semáforos avaliativos.
4. **Categoria residual "Opção 8"**: revisar com a equipe que administra o
   Google Forms o que essa opção representa e se deve virar uma categoria
   nomeada.

## Licença / propriedade

Projeto desenvolvido para a Secretaria de Estado da Saúde de Goiás a partir dos
dados fornecidos pela usuária responsável pelo diagnóstico situacional.
