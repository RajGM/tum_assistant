// app/api/prof-query/route.ts
// (Keep filename if you want; this now powers your Munich student-help "chat search" endpoint)

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const runtime = "nodejs";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_HOST = process.env.PINECONE_HOST2!;
const PINECONE_INDEX = process.env.PINECONE_INDEX2!;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE2 || ""; // optional
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY!;

if (!PINECONE_API_KEY) throw new Error("Missing PINECONE_API_KEY");
if (!PINECONE_HOST) throw new Error("Missing PINECONE_HOST2");
if (!PINECONE_INDEX) throw new Error("Missing PINECONE_INDEX2");
if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY (or OPENAI_KEY)");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const baseIndex = pc.index(PINECONE_INDEX, PINECONE_HOST);
const index =
  PINECONE_NAMESPACE && typeof (baseIndex as any).namespace === "function"
    ? (baseIndex as any).namespace(PINECONE_NAMESPACE)
    : baseIndex;

// If your SDK doesn’t support index.namespace(), we’ll pass `namespace` in query calls
const namespaceFallback =
  PINECONE_NAMESPACE && typeof (baseIndex as any).namespace !== "function"
    ? PINECONE_NAMESPACE
    : undefined;

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

type MatchForClient = {
  score: number;
  boostedScore: number;
  type: string; // dorm | study_place | text_chunk | etc.
  title: string; // name or section
  snippet: string;
};

function stripLoneSurrogates(s: string) {
  // Safety net: remove unpaired surrogates (prevents Pinecone / JSON unicode issues)
  return String(s || "").replace(/[\uD800-\uDFFF]/g, "");
}

function safeTruncateByCodepoints(s: string, maxLen: number) {
  return Array.from(String(s || "")).slice(0, maxLen).join("");
}

function makePreview(s: string, maxLen = 220) {
  return stripLoneSurrogates(safeTruncateByCodepoints((s || "").replace(/\s+/g, " ").trim(), maxLen));
}

async function embedQuery(q: string) {
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    dimensions: 512,
    input: stripLoneSurrogates(q),
  });
  return emb.data[0].embedding;
}

async function pineconeQuery(params: { vector: number[]; topK: number }) {
  const payload: any = {
    vector: params.vector,
    topK: params.topK,
    includeMetadata: true,
  };
  if (namespaceFallback) payload.namespace = namespaceFallback;
  return await (index as any).query(payload);
}

function inferIntent(q: string) {
  const s = (q || "").toLowerCase();
  if (/(dorm|rent|room|apartment|housing|wohnheim)/.test(s)) return "dorm";
  if (/(study|library|quiet|wifi|open|cafe|outlet|socket)/.test(s)) return "study_place";
  return "general";
}

function scoreBoost(match: any, intent: string) {
  const md = match?.metadata || {};
  const t = String(md.entity_type || md.kind || "").toLowerCase();
  if (intent === "dorm" && t === "dorm") return 0.08;
  if (intent === "study_place" && t === "study_place") return 0.08;
  if (intent === "general" && (t === "text" || t === "text_chunk")) return 0.03;
  return 0;
}

function dedupeKey(match: any) {
  const md = match?.metadata || {};
  if (md.entity_type && md.entity_id) return `${md.entity_type}:${md.entity_id}`;
  if (md.name) return `name:${md.name}`;
  if (md.section) return `section:${md.section}`;
  return `id:${match?.id || ""}`;
}

function matchesToClient(matches: any[], intent: string): MatchForClient[] {
  return matches.map((m) => {
    const md = m.metadata || {};
    const type = String(md.entity_type || md.kind || "unknown");
    const title = String(md.name || md.section || md.chunk_block || md.chunkBlock || "(result)");
    const text = String(md.text || "");
    const baseScore = Number(m.score ?? 0);
    const boostedScore = baseScore + scoreBoost(m, intent);
    return {
      score: baseScore,
      boostedScore,
      type,
      title,
      snippet: md.text_preview ? makePreview(String(md.text_preview), 220) : makePreview(text, 220),
    };
  });
}

function buildContext(matches: any[]) {
  // IMPORTANT: feed the LLM clean text, not raw markdown/code dumps.
  // We already stored formatted "Type/Name/Address/..." in metadata.text for entities.
  return matches
    .map((m, i) => {
      const md = m.metadata || {};
      const type = String(md.entity_type || md.kind || "unknown");
      const title = String(md.name || md.section || md.chunk_block || "(untitled)");
      const text = stripLoneSurrogates(String(md.text || "")).trim();

      return [`[Source ${i + 1}] ${type}: ${title}`, "", text].join("\n");
    })
    .join("\n\n---\n\n");
}

/**
 * Rewrite the latest user message into a standalone retrieval query using chat history.
 * Helps follow-ups ("what about weekends?", "is it free?") work well.
 */
async function rewriteToStandalone(messages: ChatMsg[]) {
  const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a query rewriter for semantic search.\n" +
          "Rewrite the user's latest message into a fully standalone question.\n" +
          "Rules:\n" +
          "- Resolve pronouns and references using the conversation.\n" +
          "- Preserve the user's intent; do not add facts.\n" +
          "- Keep it short.\n" +
          "Output ONLY the rewritten question (no quotes, no commentary).",
      },
      ...history,
      { role: "user", content: "Rewrite my latest message into a standalone question." },
    ],
  });

  return (
    resp.choices[0]?.message?.content?.trim() ||
    messages[messages.length - 1]?.content ||
    ""
  );
}

async function askLLM(finalQuestion: string, intent: string, context: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful, friendly assistant inside a student-help website for Munich.\n" +
          "Answer conversationally (natural language), not by dumping raw chunks.\n" +
          "Use ONLY the provided context.\n" +
          "If the context does not contain enough information, say what is missing and ask ONE short follow-up question.\n" +
          "Do NOT mention Pinecone, embeddings, vectors, or retrieval.\n" +
          "When recommending places, include: name + 2–4 key reasons (hours, quiet, wifi, free, rent, distance, etc.) if present.\n" +
          `The user's intent is: ${intent}.`,
      },
      {
        role: "user",
        content: `Question:\n${finalQuestion}\n\nContext:\n${context}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body?.messages as ChatMsg[] | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid "messages" array in body' }, { status: 400 });
    }

    const last = messages[messages.length - 1];
    if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
      return NextResponse.json(
        { error: 'The last message must be a user message with non-empty "content".' },
        { status: 400 }
      );
    }

    // 0) Rewrite to standalone (keeps multi-turn chat feeling)
    const rewrittenQuestion = await rewriteToStandalone(messages);
    const intent = inferIntent(rewrittenQuestion);

    // 1) Embed rewritten query (must match your upsert settings: 512 dims)
    const qVec = await embedQuery(rewrittenQuestion);

    // 2) Single-stage retrieval (NO metadata filters)
    const res = await pineconeQuery({ vector: qVec, topK: 18 });
    const rawMatches: any[] = res?.matches || [];

    if (!rawMatches.length) {
      return NextResponse.json({
        answer: "I couldn't find relevant information for that in the current knowledge base.",
        matches: [],
        rewrittenQuestion,
      });
    }

    // 3) Light boost + sort + dedupe (so results are diverse, not repetitive)
    const boosted = rawMatches
      .map((m) => ({
        ...m,
        _boostedScore: Number(m.score ?? 0) + scoreBoost(m, intent),
      }))
      .sort((a, b) => Number(b._boostedScore ?? 0) - Number(a._boostedScore ?? 0));

    const picked: any[] = [];
    const seen = new Set<string>();

    for (const m of boosted) {
      if (picked.length >= 8) break;
      const key = dedupeKey(m);
      if (seen.has(key)) continue;

      // only keep if it actually has text
      const text = String(m?.metadata?.text || "").trim();
      if (!text) continue;

      seen.add(key);
      picked.push(m);
    }

    if (!picked.length) {
      return NextResponse.json({
        answer: "I found related entries, but none had usable text to answer with.",
        matches: [],
        rewrittenQuestion,
      });
    }

    const context = buildContext(picked);

    // 4) Conversational answer (LLM synthesis)
    const answer = await askLLM(rewrittenQuestion, intent, context);

    return NextResponse.json({
      answer,
      matches: matchesToClient(picked, intent), // for UI cards / “why this answer”
      rewrittenQuestion, // optional (remove in prod if you want)
      intent, // optional (handy for UI)
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("API error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
