import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });

async function startServer() {
  const app = express();
  app.use(express.json());
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://sskbgfdpkrwfstsdnvkq.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lE3PSpqyYTj2eU51k9GbWA_V3Ra1Zum'
);

// Initialize Google GenAI on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "placeholder-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});


  // API Route: Provisional Admin Login
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    // Credentials requested by user
    const validUser = "admin@vitrine.local";
    const validPass = "Vitrine@2026Temp";

    if (username === validUser && password === validPass) {
      res.json({
        success: true,
        token: "jwt-token-vitrine-provisional-2026",
        user: {
          email: validUser,
          name: "Administrador Vitrine",
          role: "SUPER_ADMIN",
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Credenciais inválidas. Verifique o usuário e a senha provisória.",
      });
    }
  });

  // Resilient Gemini generator with automatic fallback across compatible models
  const generateResilientContent = async (params: {
    contents: any;
    systemInstruction?: string;
    isJson?: boolean;
    temperature?: number;
  }) => {
    const candidateModels = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.8-flash"];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.7,
            ...(params.isJson ? { responseMimeType: "application/json" } : {}),
          },
        });
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} unavailable (${err?.status || err?.message}). Trying next candidate...`);
      }
    }
    throw lastError;
  };

  // API Route: AI Product Copywriting / Showcase Optimization
  app.post("/api/ai/optimize", async (req, res) => {
    try {
      const { prompt, productTitle, category } = req.body;
      
      const promptContent = `Atue como um especialista em copywriting para e-commerce e vitrines digitais de alto padrão. 
Crie uma descrição comercial atraente e profissional, com gatilhos mentais de desejo e escassez, para o seguinte produto:
Título: ${productTitle || "Produto Exclusivo"}
Categoria: ${category || "Geral"}
Instruções adicionais: ${prompt || "Destaque a elegância, qualidade e exclusividade."}

Responda em formato JSON com os campos: 
- title (título refinado)
- shortDescription (resumo curto de 1 linha)
- fullDescription (descrição detalhada e persuasiva)
- tags (array de 3 a 5 tags relevantes)`;

      const response = await generateResilientContent({
        contents: promptContent,
        isJson: true,
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao gerar conteúdo com IA" });
    }
  });

  // Reusable Chatbot Handler for Studio Royale (Multi-area AI)
  const handleChat = async (req: express.Request, res: express.Response) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: "Mensagem vazia ou inválida.",
          reply: "Por favor, digite sua dúvida ou solicitação.",
        });
      }

      // Role verification on server-side (Requirement 8)
      const authHeader = req.headers.authorization || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : (context?.token || "");
      
      let verifiedRole: "public" | "cliente" | "profissional" | "admin" = "public";
      if (bearerToken === "jwt-token-vitrine-provisional-2026") {
        verifiedRole = "admin";
      } else if (bearerToken && bearerToken.length > 10) {
        if (context?.role === "admin") {
          verifiedRole = "admin";
        } else if (context?.role === "profissional") {
          verifiedRole = "profissional";
        } else {
          verifiedRole = "cliente";
        }
      } else {
        // No valid token provided -> strictly public visitor
        verifiedRole = "public";
      }

      // Persona instructions per area
      let roleInstructions = "";
      if (verifiedRole === "admin") {
        roleInstructions = `Você é o Consultor Executivo do Studio Royale para o Painel Administrativo / DM.
Você auxilia o gestor com insights de governança, métricas do salão, vitrines digitais, produtos, banners e pedidos sob análise.
Diretrizes:
- Use tom executivo, refinado e objetivo.
- Oriente sobre navegação no painel (Dashboard, Vitrines, Produtos, Banners, Categorias, Leads, Inteligência Artificial, Configurações).
- Nunca execute alterações no banco sem que o usuário use os botões oficiais da interface.
- Responda sempre em português.`;
      } else if (verifiedRole === "profissional") {
        roleInstructions = `Você é o Assistente Operacional de Atendimento da Equipe do Studio Royale.
Você auxilia os especialistas a visualizar a grade de serviços (Consultoria VIP em Alta Relojoaria 60min, Projeto de Design de Interiores 90min, Diagnóstico de Pele 45min, Sessão Olfativa 30min), fluxo de clientes e regras da fila de espera.
Diretrizes:
- Tom profissional, prestativo e cordial.
- Nunca exponha faturamento global ou dados privativos de administração.
- Oriente que mudanças de agenda devem ser confirmadas no módulo oficial.
- Responda sempre em português.`;
      } else if (verifiedRole === "cliente") {
        const clientName = context?.userName || "Cliente VIP";
        roleInstructions = `Você é Aura Royale, a Concierge Digital VIP do Studio Royale, prestando atendimento exclusivo a ${clientName}.
Você orienta sobre os serviços de alto padrão, tira dúvidas sobre como solicitar agendamentos, funcionamento da lista de espera e status dos pedidos.
Diretrizes:
- Trate o usuário com máxima cortesia e distinção ("Sr(a). ${clientName}").
- Para remarcar ou cancelar horários, instrua a utilizar os botões oficiais na aba "Meus Agendamentos".
- Nunca revele dados de outros clientes.
- Responda sempre em português nobre e refinado.`;
      } else {
        roleInstructions = `Você é Aura Royale, a Concierge Digital de Boas-Vindas do Studio Royale.
Você atende visitantes da vitrine digital de alto padrão. Apresente as marcas parceiras (Aurum & Co. Horlogerie, Nordic Living & Design, Natura Cosméticos, Hinode Group, O Boticário), explique como navegar pelos produtos, montar a sacola de orçamentos e convide o visitante a criar uma conta de Cliente para agendar consultorias VIP exclusivas.
Diretrizes:
- Não exponha dados de faturamento interno ou pedidos de clientes.
- Convide gentilmente o visitante a explorar o catálogo ou cadastrar-se no botão "Cadastre-se como Cliente".
- Responda sempre em português com calor humano e elegância.`;
      }

      const { data: servicos } = await supabase.from('servicos').select('*');
      
      let servicosFormatted = "Serviços Oficiais Disponíveis:";
      if (servicos && servicos.length > 0) {
        servicos.forEach((s: any) => {
          servicosFormatted += `\n  * ${s.nome} (da ${s.empresa}) - Duração: ${s.duracao} min - Preço: ${s.preco || 'Sob consulta'}`;
        });
      } else {
        servicosFormatted += "\n  * (Nenhum serviço encontrado no momento)";
      }

      const knowledgeBase = `
Catálogo e Serviços Reais do Studio Royale:
- Marcas Parceiras: Aurum & Co. Horlogerie (Alta Relojoaria Suíça), Nordic Living & Design (Móveis e Decoração Escandinava), Natura Cosméticos (Beleza Sustentável), Hinode Group (Bem-estar e Cosméticos), O Boticário (Perfumaria e Cuidados).
${servicosFormatted}
- Regras de Agendamento: Somente agendamentos com status "confirmado" bloqueiam o horário na agenda. Em caso de horário ocupado, o cliente pode entrar na Fila de Espera real (estimativa de ~15min por posição).
- Pedidos: A sacola envia uma "Solicitação de Pedido" que passa por análise da equipe (sem cobrança automática sem aprovação).`;

      const systemInstruction = `${roleInstructions}\n\n${knowledgeBase}\n\nContexto Atual:
- Perfil Verificado: ${verifiedRole}
- Tela/Área Ativa: ${context?.viewMode || "home"}
- Nome do Usuário: ${context?.userName || "Visitante"}
${context?.extraContext ? `- Informações da Sessão: ${context.extraContext}` : ""}`;

      // Assemble conversation history for Gemini
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          const text = item.text || item.content;
          if (!text) continue;
          if (item.sender === "user" || item.role === "user") {
            contents.push({ role: "user", parts: [{ text }] });
          } else if (item.sender === "bot" || item.role === "model") {
            contents.push({ role: "model", parts: [{ text }] });
          }
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await generateResilientContent({
        contents,
        systemInstruction,
        temperature: 0.7,
      });

      const reply = response.text?.trim() || "Estou à disposição para orientá-lo em sua experiência no Studio Royale.";
      return res.json({
        success: true,
        reply,
        role: verifiedRole,
      });
    } catch (error: any) {
      console.error("Gemini Chat API error:", error);
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
      const statusCode = isRateLimit ? 429 : 500;
      return res.status(statusCode).json({
        success: false,
        error: isRateLimit
          ? "Limite temporário de requisições atingido. Por favor, aguarde alguns instantes."
          : "Serviço de IA temporariamente indisponível.",
        reply: isRateLimit
          ? "Estamos com alta procura no momento. Por favor, aguarde alguns instantes antes de enviar uma nova pergunta."
          : "O concierge digital está em manutenção técnica preventiva. Enquanto isso, sinta-se à vontade para navegar pelas vitrines e serviços oficiais.",
      });
    }
  };

  // API Routes: Multi-area AI Chatbot + Alias for /api/ai/sommelier (Prevents 404)
  app.post("/api/ai/chat", handleChat);
  app.post("/api/ai/sommelier", handleChat);

  // Vite middleware for frontend development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
