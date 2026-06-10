const UPSTREAM_HOME_URL = 'https://semantle-ko.newsjel.ly/';
const UPSTREAM_GUESS_BASE_URL = 'https://semantle-ko.newsjel.ly/guess';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const jsonResponse = (body: unknown, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};

const htmlToText = (html: string): string => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractCurrentDay = (html: string): number | null => {
  const candidates = [
    htmlToText(html),
    html,
  ];

  const patterns = [
    /(\d{1,6})\s*번째\s*꼬맨틀/u,
    /꼬맨틀\s*#?\s*(\d{1,6})/u,
    /(?:day|puzzle|game|number|today)[_"'\s:-]*(\d{1,6})/iu,
    /["'](?:day|puzzle|game|number|today)["']\s*:\s*(\d{1,6})/iu,
  ];

  for (const candidate of candidates) {
    for (const pattern of patterns) {
      const match = candidate.match(pattern);
      const day = match?.[1] ? Number(match[1]) : NaN;

      if (Number.isInteger(day) && day > 0) {
        return day;
      }
    }
  }

  return null;
};

const extractCurrentDayFromJson = (payload: unknown): number | null => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const day = (payload as Record<string, unknown>).answer_id;

  if (typeof day === 'number' && Number.isInteger(day) && day > 0) {
    return day;
  }

  return null;
};

const proxyCurrentDay = async (): Promise<Response> => {
  try {
    const upstreamResponse = await fetch(UPSTREAM_HOME_URL, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    });

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: 'upstream request failed' }, 500);
    }

    const html = await upstreamResponse.text();
    const day = extractCurrentDay(html);

    if (day) {
      return jsonResponse({ day });
    }

    const todayResponse = await fetch(`${UPSTREAM_HOME_URL}today`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!todayResponse.ok) {
      return jsonResponse({ error: 'upstream request failed' }, 500);
    }

    const todayPayload: unknown = await todayResponse.json();
    const today = extractCurrentDayFromJson(todayPayload);

    if (!today) {
      return jsonResponse({ error: 'current day not found' }, 500);
    }

    return jsonResponse({ day: today });
  } catch {
    return jsonResponse({ error: 'upstream request failed' }, 500);
  }
};

const proxyGuess = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const day = url.searchParams.get('day')?.trim();
  const word = url.searchParams.get('word')?.trim();

  if (!day || !word) {
    return jsonResponse({ error: 'invalid request' }, 400);
  }

  const upstreamUrl = `${UPSTREAM_GUESS_BASE_URL}/${encodeURIComponent(day)}/${encodeURIComponent(word)}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: 'upstream request failed' }, 500);
    }

    const upstreamJson = await upstreamResponse.text();

    return new Response(upstreamJson, {
      status: upstreamResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstreamResponse.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
      },
    });
  } catch {
    return jsonResponse({ error: 'upstream request failed' }, 500);
  }
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'invalid request' }, 400);
    }

    if (url.pathname === '/current-day') {
      return proxyCurrentDay();
    }

    if (url.pathname === '/guess') {
      return proxyGuess(request);
    }

    return jsonResponse({ error: 'invalid request' }, 400);
  },
};
