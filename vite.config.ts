import { defineConfig, loadEnv, type Plugin, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import type { ServerResponse } from "node:http";

/**
 * Plugin de desenvolvimento local que expõe /api/dados usando exatamente a
 * mesma camada de transformação usada pela Netlify Function em produção
 * (netlify/functions/dados.ts -> src/lib/pipeline.ts). Isso evita duplicar
 * a lógica de leitura/limpeza/anonimização entre ambiente local e produção.
 */
function apiDadosDevPlugin(): Plugin {
  return {
    name: "api-dados-dev-middleware",
    configureServer(server) {
      server.middlewares.use("/api/dados", async (req: Connect.IncomingMessage, res: ServerResponse) => {
        try {
          const { handleDadosRequest } = await server.ssrLoadModule("/src/lib/pipeline.ts");
          const force = (req.url || "").includes("force=1");
          const result = await handleDadosRequest({ forceRefresh: force });
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = result.status;
          res.end(JSON.stringify(result.body));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Falha ao processar dados", detail: String(err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Vite só injeta em `process.env` as variáveis prefixadas com VITE_ (para
  // uso no bundle do navegador). GOOGLE_SHEETS_CSV_URL e REVALIDATE_TOKEN são
  // lidas do lado do servidor (pipeline.ts, via process.env) e nunca devem
  // chegar ao navegador — por isso carregamos o .env manualmente aqui com
  // prefixo vazio ("") e copiamos só para process.env (nunca para `define`),
  // replicando como a Netlify Function já recebe essas variáveis em
  // produção (injetadas diretamente pela plataforma). Sem isso, `npm run dev`
  // sempre caía na planilha de referência local mesmo com GOOGLE_SHEETS_CSV_URL
  // definida em .env — a variável nunca chegava ao processo Node do Vite.
  const env = loadEnv(mode, process.cwd(), "");
  for (const chave of ["GOOGLE_SHEETS_CSV_URL", "REVALIDATE_TOKEN"]) {
    if (env[chave] && !process.env[chave]) process.env[chave] = env[chave];
  }

  return {
    plugins: [react(), apiDadosDevPlugin()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      host: true,
      port: 5173,
    },
    build: {
      // Code-splitting de bibliotecas pesadas (gráficos) em chunk próprio —
      // regra 2.12 ("bom desempenho, carregamento sob demanda").
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ["recharts"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
    },
  };
});
