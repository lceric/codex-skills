---
name: next-console-engineering
description: Build, refactor, and troubleshoot production-style Next.js console/admin features in an existing repo. Use this skill whenever the user asks to add a console page, dashboard/admin layout, login-gated app flow, API integration, Node-layer proxy, cookie/session auth, token/key management UI, or asks to split large frontend components into maintainable modules. This skill is especially relevant for Next App Router projects where AGENTS.md warns that framework APIs may differ from prior training data.
---

# Next Console Engineering

Use this skill to implement engineering-grade console/admin features in an existing Next.js project. It captures the workflow from the semai console work: read the repo and local framework docs first, make conservative scoped changes, proxy API calls through the Node layer when browser CORS or HTTP Only cookies matter, and keep frontend components small enough to maintain.

## First Pass

1. Read `AGENTS.md`, package scripts, `next.config.*`, `tsconfig.json`, and the existing `app/`, `components/`, and `lib/` structure before editing.
2. If `AGENTS.md` says this is a nonstandard or breaking Next version, read the relevant local docs under `node_modules/next/dist/docs/` before writing code. Prefer local docs over memory.
3. Identify the active routing style. For App Router, use `app/**/page.tsx`, `layout.tsx`, and `route.ts` conventions.
4. Preserve user edits. Check current files before replacing a large component or route.
5. Run the repo’s own validation commands after changes, usually `npm run lint` and `npm run build`.

## API Integration Pattern

When the user gives an upstream service URL and the browser hits CORS or HTTP Only cookie issues, use a same-origin Node proxy:

```txt
Browser -> /api/user/login
Next route handler -> https://upstream.example.com/api/user/login
```

For App Router, create a catch-all route:

```txt
app/api/[...path]/route.ts
```

Then reconstruct the upstream path by prepending `api`:

```ts
const { path } = await context.params
const targetUrl = new URL(
  ["api", ...path].join("/"),
  `${SERVICE_URL.replace(/\/$/, "")}/`,
)
targetUrl.search = new URL(request.url).search
```

Use this approach when:

- The upstream sets an HTTP Only session cookie after login.
- The upstream CORS settings do not allow credentialed browser requests.
- The UI should call stable same-origin paths like `/api/token/?p=1&size=10`.

Proxy details:

- Forward request method, query string, headers, and non-GET body.
- Remove hop-by-hop headers such as `host`, `connection`, and `content-length`.
- Use `cache: "no-store"` for management APIs.
- Preserve `Set-Cookie` from upstream. If the upstream cookie has a foreign `Domain`, rewrite/remove it so the cookie can be stored on the current app domain.
- Keep credentials on the frontend as `credentials: "same-origin"` when same-origin cookies are expected.

## Auth Session Pattern

For login-gated console pages:

1. Treat token auth and session-cookie auth as different possibilities.
2. If login returns an access token, store it only if the existing app already uses local token storage or the user requests it.
3. If login sets an HTTP Only cookie, do not require a token in the response. Keep only minimal UI session state locally, such as username/display name, to decide whether to show the console.
4. Route logout through the API if a logout endpoint exists. Otherwise clear local UI session state and note that server session invalidation still needs an endpoint.

## Config Pattern

Keep service and menu configuration isolated:

```txt
lib/api-config.ts       # upstream URL, public route prefixes if any
lib/console-config.ts   # sidebar menu and feature labels
lib/newapi.ts           # typed API client functions
```

Prefer APIs shaped like:

```ts
listTokens(session, { page: 1, size: 10, keyword: "" })
```

over hard-coded query strings in components.

## Component Boundaries

Avoid large all-in-one console files. Split by responsibility:

```txt
components/console/
  console-app.tsx          # session bootstrap and entry switch
  console-shell.tsx        # overall layout and active menu state
  login-screen.tsx         # login form only
  layout/
    console-header.tsx
    console-sidebar.tsx
    placeholder.tsx
  tokens/
    token-management.tsx   # token list state and orchestration
    token-dialog.tsx       # create/edit form
    search-input.tsx
    table-checkbox.tsx
    token-format.ts        # formatting helpers
    clipboard.ts           # copy helpers
```

Guidelines:

- Keep stateful feature orchestration in the feature component, not in the app shell.
- Move pure formatting helpers to `.ts` files.
- Move reusable small UI elements to focused `.tsx` files.
- Keep API calls in `lib/*`, not directly inside low-level UI controls.
- Use existing UI primitives and icon libraries already present in the repo.

## Console UI Expectations

For admin/console UIs, favor dense and predictable layouts:

- Sidebar on the left, header/breadcrumb top, main content on the right.
- Tables for management lists.
- Search controls, bulk actions, pagination, empty/error/loading states.
- Add/edit dialogs for entity mutation.
- Avoid marketing-page hero sections inside console workflows.

For token/key management specifically:

- Mask secrets by default.
- Add reveal and copy actions.
- Add selection and bulk copy/delete where useful.
- Surface pagination parameters as real API query params, e.g. `?p=1&size=10`.
- Keep API response parsing tolerant of `items`, `rows`, `tokens`, `total`, `count`, and array-shaped payloads when docs are incomplete.

## Verification

Before final response:

1. Run `npm run lint`.
2. Run `npm run build`.
3. If a dev server is relevant, verify the local URL returns 200.
4. In the final response, list changed files by responsibility and mention any remaining uncertainty, especially unverified upstream API details.

## Common Pitfalls

- Do not call an upstream API directly from the browser when HTTP Only cookies or CORS credentials are involved.
- Do not require a token when the login flow is cookie-based.
- Do not leave `/api/proxy` or other artificial prefixes if the user explicitly wants natural same-origin `/api/*` paths.
- Do not keep a 700+ line client component after adding several dialogs, tables, and layout pieces; split it before finishing.
- Do not rely on old Next.js memory when local docs or AGENTS.md indicate breaking changes.
