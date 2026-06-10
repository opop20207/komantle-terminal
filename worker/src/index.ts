const UPSTREAM_BASE_URL = 'https://semantle-ko.newsjel.ly/guess';

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

const proxyGuess = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const day = url.searchParams.get('day')?.trim();
  const word = url.searchParams.get('word')?.trim();

  if (!day || !word) {
    return jsonResponse({ error: 'invalid request' }, 400);
  }

  const upstreamUrl = `${UPSTREAM_BASE_URL}/${encodeURIComponent(day)}/${encodeURIComponent(word)}`;

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

    if (request.method !== 'GET' || url.pathname !== '/guess') {
      return jsonResponse({ error: 'invalid request' }, 400);
    }

    return proxyGuess(request);
  },
};
