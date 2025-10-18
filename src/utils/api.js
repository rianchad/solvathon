function getOpenAIKey() {
  const k = import.meta.env.VITE_OPENAI_API_KEY;
  window.OPENAI_KEY_PRESENT = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
  if (import.meta.env.DEV) console.debug("[OpenAI] Key present:", Boolean(k));
  return k;
}

// Add: sleep, rate-limit, and retry helpers
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Shared cooldown state (persist + cross-tab)
const COOLDOWN_LS_KEY = "openai_cooldown_until";
let cooldownUntil = Number(localStorage.getItem(COOLDOWN_LS_KEY) || 0);
const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("openai-backoff") : null;

function getSharedCooldownUntil() {
  return Math.max(cooldownUntil, Number(localStorage.getItem(COOLDOWN_LS_KEY) || 0));
}
function setSharedCooldownUntil(tsMs) {
  cooldownUntil = Math.max(cooldownUntil, tsMs);
  try {
    localStorage.setItem(COOLDOWN_LS_KEY, String(cooldownUntil));
  } catch {}
  try {
    bc?.postMessage({ type: "cooldown", until: cooldownUntil });
  } catch {}
}
bc && (bc.onmessage = (e) => {
  if (e?.data?.type === "cooldown" && typeof e.data.until === "number") {
    cooldownUntil = Math.max(cooldownUntil, e.data.until);
  }
});

// Pacing: allow override via env (default ~1 req / 60s)
const RATE_LIMIT_MIN_INTERVAL_MS = Number(
  import.meta.env.VITE_OPENAI_MIN_INTERVAL_MS ?? 60000
) || 60000;

// Export a getter so UI can reflect remaining cooldown seconds
export function getOpenAICooldownSeconds() {
  return Math.max(0, Math.ceil((getSharedCooldownUntil() - Date.now()) / 1000));
}

// New: simple config check for UI
export function isOpenAIConfigured() {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY);
}

// Queue with cooldown awareness
const scheduleRequest = (() => {
  let lastStart = 0;
  let chain = Promise.resolve();
  return (fn) => {
    const run = chain.then(async () => {
      // Wait for cooldown if active (shared across tabs)
      const now = Date.now();
      const sharedCd = getSharedCooldownUntil();
      if (sharedCd > now) {
        await sleep(sharedCd - now);
      }
      const elapsed = Date.now() - lastStart;
      const wait = Math.max(0, RATE_LIMIT_MIN_INTERVAL_MS - elapsed);
      if (wait) await sleep(wait);
      lastStart = Date.now();
      return fn();
    });
    chain = run.catch(() => {});
    return run;
  };
})();

function computeBackoff(attempt, retryAfterHeader) {
  const jitter = Math.floor(Math.random() * 250);
  // Honor Retry-After if present, with a floor and cap
  if (retryAfterHeader) {
    const secs = Number(retryAfterHeader);
    if (!Number.isNaN(secs) && secs >= 0) {
      const ms = secs * 1000;
      return Math.max(10000, Math.min(60000, ms + jitter));
    }
    const dateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(dateMs)) {
      const ms = dateMs - Date.now();
      if (ms > 0) return Math.max(10000, Math.min(60000, ms + jitter));
    }
  }
  const base = 1000; // ms
  const max = 60000; // cap
  const delay = Math.min(max, base * Math.pow(2, attempt));
  return Math.min(max, delay) + jitter;
}

// New: set cooldown from rate limit headers for precise backoff
function setCooldownFromHeaders(res) {
  const remainingReqStr = res.headers.get("x-ratelimit-remaining-requests");
  const resetReqStr = res.headers.get("x-ratelimit-reset-requests");
  const remainingTokStr = res.headers.get("x-ratelimit-remaining-tokens");
  const resetTokStr = res.headers.get("x-ratelimit-reset-tokens");
  const retryAfter = res.headers.get("retry-after");

  const toNum = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const remainingReq = toNum(remainingReqStr);
  const remainingTok = toNum(remainingTokStr);

  const parseResetMs = (v) => {
    if (!v) return 0;
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0 && n < 24 * 3600) return n * 1000; // seconds
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return Math.max(0, d - Date.now());
    return 0;
  };

  // Base from headers
  let ms = 0;
  // Proactive: if nearly out of requests/tokens, wait until reset
  if ((remainingReq !== undefined && remainingReq <= 1 && resetReqStr) ||
      (remainingTok !== undefined && remainingTok <= 10000 && resetTokStr)) {
    ms = Math.max(parseResetMs(resetReqStr), parseResetMs(resetTokStr));
  } else if (retryAfter) {
    ms = parseResetMs(retryAfter);
  }

  if (ms > 0) setSharedCooldownUntil(Math.max(getSharedCooldownUntil(), Date.now() + ms));

  if (import.meta.env.DEV) {
    console.debug("[OpenAI] rate headers", {
      remainingReq, remainingTok, resetReqStr, resetTokStr, retryAfter, cooldownUntil
    });
  }
}

// In-flight dedupe to avoid duplicate identical POSTs
const inFlight = new Map();
// Lightweight cache for CivicBot responses (10 min TTL)
const civicBotCache = new Map();
const CIVICBOT_TTL_MS = 10 * 60 * 1000;

function reqKey(url, options) {
  const body = typeof options?.body === "string" ? options.body : "";
  return `${options?.method || "GET"} ${url} ${body}`;
}

// Default retries to 0 to avoid bursts
async function requestWithRetry(url, options, { maxRetries = 0 } = {}) {
  const key = reqKey(url, options);
  if (inFlight.has(key)) return inFlight.get(key);

  let attempt = 0;
  const p = (async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await scheduleRequest(() => fetch(url, options));
        setCooldownFromHeaders(res);
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt >= maxRetries) return res;
          const retryAfter = res.headers.get("retry-after");
          const waitMs = computeBackoff(attempt, retryAfter);
          setSharedCooldownUntil(Date.now() + waitMs);
          await sleep(waitMs);
          attempt++;
          continue;
        }
        return res;
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        const waitMs = computeBackoff(attempt);
        setSharedCooldownUntil(Date.now() + waitMs);
        await sleep(waitMs);
        attempt++;
      }
    }
  })();

  inFlight.set(key, p);
  p.finally(() => inFlight.delete(key));
  return p;
}

export async function evaluateTownHall(proposal, context = "") {
  const key = getOpenAIKey();
  if (!key) throw new Error("Missing OpenAI API key");

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    // Slightly higher to fit stricter sections
    max_tokens: 260,
    messages: [
      {
        role: "system",
        content:
          "You are a concise civic engagement coach for youth. If Local Context is provided, use it to tailor advice and propose concrete next steps tied to local events/challenges when helpful. Evaluate clarity and realism. Return sections in EXACTLY this order with crisp bullets and ≤300 words total: 1) Scores (Clarity 0-10; Realism 0-10) 2) Strengths 3) Risks/Gaps 4) Feasibility (next 30 days: 3 low-cost steps) 5) Key stakeholders 6) 30-second pitch (one paragraph) 7) 2 follow-up questions. Be encouraging, specific, and do not add extra sections or preambles.",
      },
      ...(context
        ? [
            {
              role: "system",
              content: `Local Context (authoritative; prefer over general knowledge):\n${context}`,
            },
          ]
        : []),
      {
        role: "user",
        content:
          `Evaluate this town hall proposal using the rubric above.\n\nProposal:\n${proposal}`,
      },
    ],
  };

  const res = await requestWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    }
    // no override; uses default maxRetries = 0
  );

  setCooldownFromHeaders(res);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      const secs = Math.ceil(Math.max(0, cooldownUntil - Date.now()) / 1000);
      throw new Error(`Civic services are busy. Please wait ${secs || 5}s and try again.`);
    }
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

export async function askCivicBot(query, context = "", userId) {
  const key = getOpenAIKey();
  if (!key) throw new Error("Missing OpenAI API key");

  // Cache lookup
  const cacheKey = `${query}::${context}`;
  const cached = civicBotCache.get(cacheKey);
  if (cached && Date.now() - cached.t < CIVICBOT_TTL_MS) return cached.v;

  // Truncate context to reduce tokens
  const truncatedContext = (context || "").slice(0, 1200);

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 150,
    user: String(userId || "anon"),
    messages: [
      {
        role: "system",
        content:
          "You are a concise, friendly civic assistant for youth. Ground answers in Local Context first. Never invent facts or links. Prefer concrete, local guidance tied to specific items by title (posts/events/challenges). Use bullet points for lists, keep to ~6 short sentences, and ask one brief clarifying question at the end only if the query is ambiguous. Use the user’s locale when referencing dates.",
      },
      ...(truncatedContext
        ? [
            {
              role: "system",
              content: `Local Context (authoritative; prefer over general knowledge):\n${truncatedContext}`,
            },
          ]
        : []),
      { role: "user", content: query },
    ],
  };

  const res = await requestWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    }
    // no override; uses default maxRetries = 0
  );

  setCooldownFromHeaders(res);

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    // Try to decode OpenAI error payload
    let type = "";
    let detail = raw;
    try {
      const j = JSON.parse(raw);
      type = j?.error?.type || "";
      detail = j?.error?.message || raw;
    } catch {}
    if (res.status === 429) {
      if (type === "insufficient_quota") {
        throw new Error("CivicBot is unavailable (quota exceeded). Please try later.");
      }
      const secs = Math.ceil(Math.max(0, cooldownUntil - Date.now()) / 1000) || 5;
      throw new Error(`CivicBot is busy. Please wait ${secs}s and try again.`);
    }
    throw new Error(`CivicBot error: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const answer = (data?.choices?.[0]?.message?.content || "").trim();

  civicBotCache.set(cacheKey, { v: answer, t: Date.now() });
  return answer;
}