import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const distDir = path.resolve(__dirname, 'dist');
const distIndexPath = path.join(distDir, 'index.html');
const isDev =
  process.env.NODE_ENV === 'development' || !fs.existsSync(distIndexPath);

interface RawPair {
  left?: unknown;
  right?: unknown;
}

interface RawTask {
  type?: unknown;
  prompt?: unknown;
  pairs?: unknown;
  answer?: unknown;
  answers?: unknown;
  hint?: unknown;
  options?: unknown;
  correctIndex?: unknown;
}

type SanitizedTask =
  | {
      type: 'match';
      prompt: string;
      pairs: { left: string; right: string }[];
    }
  | {
      type: 'fill';
      prompt: string;
      answer: string;
      answers?: string[];
      hint?: string;
    }
  | {
      type: 'choice';
      prompt: string;
      options: string[];
      correctIndex: number;
    };

function sanitizeGeneratedTasks(rawList: unknown): SanitizedTask[] {
  if (!Array.isArray(rawList)) return [];
  const result: SanitizedTask[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const t = item as RawTask;
    const prompt = typeof t.prompt === 'string' ? t.prompt.trim() : '';
    if (!prompt) continue;

    if (t.type === 'match' && Array.isArray(t.pairs)) {
      const pairs: { left: string; right: string }[] = [];
      const seenLeft = new Set<string>();
      const seenRight = new Set<string>();
      for (const p of t.pairs as RawPair[]) {
        if (!p || typeof p !== 'object') continue;
        const left = typeof p.left === 'string' ? p.left.trim() : '';
        const right = typeof p.right === 'string' ? p.right.trim() : '';
        if (!left || !right) continue;
        if (seenLeft.has(left.toLowerCase()) || seenRight.has(right.toLowerCase())) {
          continue;
        }
        seenLeft.add(left.toLowerCase());
        seenRight.add(right.toLowerCase());
        pairs.push({ left, right });
      }
      if (pairs.length >= 2) {
        result.push({ type: 'match', prompt, pairs: pairs.slice(0, 6) });
      }
    } else if (t.type === 'fill') {
      const primary = typeof t.answer === 'string' ? t.answer.trim() : '';
      const rawAliases = Array.isArray(t.answers)
        ? t.answers
            .filter((a): a is string => typeof a === 'string')
            .map((a) => a.trim())
            .filter(Boolean)
        : [];
      const answer = primary || rawAliases[0] || '';
      if (!answer) continue;

      const allAnswers: string[] = [];
      const seen = new Set<string>();
      for (const candidate of [answer, ...rawAliases]) {
        const key = candidate.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allAnswers.push(candidate);
        }
      }

      const hint = typeof t.hint === 'string' ? t.hint.trim() : '';
      const fillTask: SanitizedTask = {
        type: 'fill',
        prompt,
        answer,
      };
      if (allAnswers.length > 1) {
        fillTask.answers = allAnswers;
      }
      if (hint) {
        fillTask.hint = hint;
      }
      result.push(fillTask);
    } else if (t.type === 'choice' && Array.isArray(t.options)) {
      const options = t.options
        .filter((o): o is string => typeof o === 'string')
        .map((o) => o.trim())
        .filter(Boolean);
      const idx =
        typeof t.correctIndex === 'number' && Number.isInteger(t.correctIndex)
          ? t.correctIndex
          : -1;
      if (options.length >= 2 && idx >= 0 && idx < options.length) {
        result.push({
          type: 'choice',
          prompt,
          options: options.slice(0, 6),
          correctIndex: idx,
        });
      }
    }
  }

  return result;
}

const TASK_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'Short, descriptive title for the generated quiz set.',
    },
    tasks: {
      type: Type.ARRAY,
      description: 'Array of educational quiz tasks mixing match, fill, and choice.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['match', 'fill', 'choice'],
            description: 'Task type: match, fill, or choice.',
          },
          prompt: {
            type: Type.STRING,
            description: 'Clear, concise question or instruction for the student.',
          },
          pairs: {
            type: Type.ARRAY,
            description: 'Required for type="match": 3 to 4 unique pairs to connect.',
            items: {
              type: Type.OBJECT,
              properties: {
                left: { type: Type.STRING },
                right: { type: Type.STRING },
              },
              required: ['left', 'right'],
            },
          },
          answer: {
            type: Type.STRING,
            description: 'Required for type="fill": short canonical answer (1-2 words or number).',
          },
          answers: {
            type: Type.ARRAY,
            description: 'Optional accepted answer variants for type="fill".',
            items: { type: Type.STRING },
          },
          hint: {
            type: Type.STRING,
            description: 'Optional short helpful hint for type="fill".',
          },
          options: {
            type: Type.ARRAY,
            description: 'Required for type="choice": 4 distinct answer choices.',
            items: { type: Type.STRING },
          },
          correctIndex: {
            type: Type.INTEGER,
            description: 'Required for type="choice": 0-based index of the correct option.',
          },
        },
        required: ['type', 'prompt'],
      },
    },
  },
  required: ['name', 'tasks'],
};

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getFriendlyApiError(err: unknown, isEn: boolean): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('403')
  ) {
    return {
      status: 403,
      message: isEn
        ? 'Gemini API authentication failed. Please check the API key in Settings > Secrets.'
        : 'Nepodařilo se ověřit Gemini API klíč. Zkontrolujte jej prosím v Settings > Secrets.',
    };
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message: isEn
        ? 'Gemini API quota or rate limit exceeded. Try again in a moment, or select a billing-enabled API key in Settings > Secrets.'
        : 'Byl dosažen limit požadavků Gemini API. Zkuste to za chvíli znovu, případně vyberte API klíč s aktivní fakturací v Settings > Secrets.',
    };
  }

  return {
    status: 502,
    message: isEn
      ? `Failed to generate tasks via Gemini (${rawMessage || 'upstream error'}).`
      : `Generování úkolů přes Gemini se nezdařilo (${rawMessage || 'chyba serveru'}).`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/generate-tasks', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as {
      topic?: unknown;
      count?: unknown;
      lang?: unknown;
    };

    const lang = body.lang === 'en' ? 'en' : 'cs';
    const isEn = lang === 'en';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';

    if (!topic) {
      res.status(400).json({
        error: isEn
          ? 'Please enter a topic or subject area for the questions.'
          : 'Zadejte prosím oblast nebo téma, ze kterého mají být otázky.',
      });
      return;
    }

    if (topic.length > 300) {
      res.status(400).json({
        error: isEn
          ? 'Topic description is too long (max 300 characters).'
          : 'Popis oblasti je příliš dlouhý (maximum je 300 znaků).',
      });
      return;
    }

    const rawCount = typeof body.count === 'number' ? body.count : Number(body.count);
    const count = Number.isFinite(rawCount)
      ? Math.max(3, Math.min(24, Math.round(rawCount)))
      : 12;

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: isEn
          ? 'Gemini API key is not configured on the server (Settings > Secrets).'
          : 'Na serveru není nastavený Gemini API klíč (Settings > Secrets).',
      });
      return;
    }

    const systemInstruction = isEn
      ? [
          'You are an experienced school teacher creating clear, factually accurate, engaging quiz tasks for a learning break inside a logic puzzle app.',
          'Generate an even mix of all three task types: "match", "fill", and "choice".',
          'For "match": always provide 3 to 4 unique pairs (left & right).',
          'For "fill": keep "answer" short and easy to type on a phone (1-2 words or a number), include a helpful "hint", and optional "answers" aliases when applicable.',
          'For "choice": always provide 4 distinct options and set "correctIndex" (0..3) accurately.',
          'Write prompts and explanations in English unless the requested topic explicitly asks for another language (e.g. vocabulary translation).',
        ].join(' ')
      : [
          'Jsi zkušený učitel, který připravuje jasné, věcně správné a zábavné výukové úkoly pro učící přestávku v aplikaci logických her.',
          'Rovnoměrně střídej všechny tři typy úloh: "match" (spojování dvojic), "fill" (doplnění krátké odpovědi) a "choice" (výběr ze 4 možností).',
          'U typu "match" dej vždy 3 až 4 jedinečné dvojice (left a right).',
          'U typu "fill" zvol krátkou a jednoznačnou odpověď vhodnou i pro psaní na mobilu (1–2 slova nebo číslo), přidej stručnou nápovědu "hint" a případné alternativní správné tvary do "answers".',
          'U typu "choice" dej vždy 4 zřetelně odlišné možnosti a přesně nastav "correctIndex" (0 až 3).',
          'Zadání piš v češtině (pokud téma výslovně nepožaduje cizí jazyk, např. překlad slovíček).',
        ].join(' ');

    const userPrompt = isEn
      ? `Generate exactly ${count} diverse, high-quality learning tasks for the following topic / subject area: ${topic}`
      : `Vygeneruj přesně ${count} pestrých a věcně správných výukových úkolů na tuto oblast / téma: ${topic}`;

    const attempts: { model: string; thinkingLevel?: ThinkingLevel }[] = [
      { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
      { model: 'gemini-3.1-flash-lite' },
    ];

    let lastError: unknown = null;
    for (let idx = 0; idx < attempts.length; idx++) {
      const { model, thinkingLevel } = attempts[idx];
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
            responseMimeType: 'application/json',
            responseSchema: TASK_RESPONSE_SCHEMA,
          },
        });

        const rawText = (response.text ?? '').trim();
        const cleanedText = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedText) as {
          name?: unknown;
          tasks?: unknown;
        };
        const tasks = sanitizeGeneratedTasks(parsed.tasks);

        if (tasks.length === 0) {
          throw new Error(
            isEn
              ? 'Model returned an empty or invalid task list.'
              : 'Model vrátil prázdný nebo neplatný seznam úkolů.'
          );
        }

        const setName =
          typeof parsed.name === 'string' && parsed.name.trim().length > 0
            ? parsed.name.trim()
            : topic;

        res.json({ name: setName, tasks });
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        const isAuthError =
          msg.includes('403') ||
          msg.includes('api_key_invalid') ||
          msg.includes('permission_denied');
        if (isAuthError || idx === attempts.length - 1) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    const mapped = getFriendlyApiError(lastError, isEn);
    res.status(mapped.status).json({ error: mapped.message });
  });

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isDev ? 'dev' : 'prod'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
