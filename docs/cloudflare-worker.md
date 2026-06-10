# Cloudflare Workers Proxy

The Komantle Terminal frontend is a static Vite app intended for GitHub Pages.
GitHub Pages cannot add server-side CORS handling, so real Komantle API requests
must go through a proxy such as Cloudflare Workers.

## Frontend Configuration

The frontend is prepared to call a proxy endpoint, but mock mode remains the
default.

Update `src/constants.ts` when a Worker endpoint is available:

```ts
export const KOMANTLE_PROXY_BASE_URL = "https://komantle-proxy.your-name.workers.dev";
```

The frontend will call:

```text
{KOMANTLE_PROXY_BASE_URL}/current-day
{KOMANTLE_PROXY_BASE_URL}/guess?day={day}&word={encodedWord}
```

## Frontend Behavior

The terminal app can switch API modes and inspect the official puzzle day:

```text
api       Show current API mode
api mock  Switch to mock API mode
api real  Switch to real API mode
api day   Fetch and display the current official puzzle day
```

If `KOMANTLE_PROXY_BASE_URL` is empty, real API calls should not be attempted and
the app should show:

```text
ERROR      proxy endpoint is not configured
Set KOMANTLE_PROXY_BASE_URL in constants.ts
```

## Worker Responsibility

The Worker should receive:

```text
/current-day
/guess?day={day}&word={encodedWord}
```

For `/current-day`, it should fetch the official Komantle homepage, extract the
current puzzle number, and return `{ "day": number }`.

For `/guess`, it should forward the request to the real Komantle endpoint and
return JSON with CORS headers that allow the GitHub Pages frontend to read the
response.
