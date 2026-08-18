# crvro.com

Personal portfolio for Christopher Rivero. Built with Vite + React.
Warm minimalist editorial — paper backgrounds, editorial serif headlines,
mono labels, indexed project list.

---

## Routing

Path-based (clean URLs):

- `/` — home (hero, work, about, skills, contact)
- `/projects/help-nearby`
- `/projects/sidecar`
- `/projects/predmkt-bot`
- `/projects/openclaw`

The router is hand-rolled (no dependency) and intercepts same-origin
link clicks for SPA navigation. Direct refreshes and shared links work
because Vercel (`vercel.json` rewrites) and Netlify (`netlify.toml`
redirects + `public/_redirects`) both fall back to `index.html` for any
non-asset path.

---

## Run locally

Requires Node 18+.

```bash
cd site
npm install
npm run dev
```

Open http://localhost:5173.

## Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # serve the build locally to sanity-check
```

---

## Deploy

### Vercel (one-click)

1. Push this repo to GitHub.
2. In Vercel, click **New Project** → import the repo.
3. Set **Root Directory** to `site/`. Framework auto-detects as Vite.
4. Deploy. Vercel reads `site/vercel.json` for `cleanUrls`.
5. Add the custom domain `crvro.com` under **Project Settings → Domains**.
   Vercel will give you DNS records — point your registrar at them.

### Netlify

1. Push this repo to GitHub.
2. In Netlify, **Add new site → Import an existing project**.
3. Set **Base directory** to `site/`.
   `netlify.toml` already declares the build command (`npm run build`) and
   publish directory (`dist`).
4. Deploy.
5. Add `crvro.com` under **Domain management** and follow the DNS prompts.

Either host serves the static `dist/` build — no server, no env vars.

---

## File structure

```
site/
├── index.html              ← entry HTML (loaded by Vite)
├── package.json
├── vite.config.js
├── vercel.json             ← Vercel build config
├── netlify.toml            ← Netlify build config
├── public/                 ← static assets served at site root
│   ├── favicon.svg
│   ├── wordmark.svg
│   └── monogram.svg
└── src/
    ├── main.jsx            ← React entry point
    ├── App.jsx             ← page assembly + scrollspy
    ├── components/
    │   ├── Header.jsx
    │   ├── Hero.jsx
    │   ├── Projects.jsx
    │   ├── ProjectMark.jsx ← geometric thumbnail shapes
    │   ├── About.jsx
    │   ├── Skills.jsx
    │   ├── Contact.jsx
    │   ├── Footer.jsx
    │   └── Icon.jsx
    └── styles/
        ├── tokens.css      ← color + type CSS variables
        └── portfolio.css   ← page layout
```

---

## Editing content

- **Hero copy** → `src/components/Hero.jsx`
- **Bio paragraphs** → `src/components/About.jsx`
- **Project list** → `src/components/Projects.jsx` (edit the `PROJECTS` array)
- **Skills columns** → `src/components/Skills.jsx`
- **Contact links / email** → `src/components/Contact.jsx`
- **Colors & type** → `src/styles/tokens.css`

---

## Contact configuration

The site displays `contact@crvro.com`.

> ⚠️  **`contact@crvro.com` still has no mailbox or DNS-level
> forwarding configured** at the domain registrar (or via a service
> like ImprovMX, Cloudflare Email Routing, or Google Workspace) --
> that's a registrar/DNS change outside this repo, not something fixed
> by editing site code. A real visitor's bounce confirmed this
> directly: a message sent straight to `contact@crvro.com` does not
> arrive anywhere.
>
> Every clickable email link on the site (`Contact.jsx`, `Footer.jsx`,
> `AIConsultation.jsx`'s "Talk about your workflow" CTA) already routes
> around that: the visible text stays `contact@crvro.com`, but each
> `mailto:` target is the real inbox, `christopherarivero@gmail.com`,
> so clicking any of them reaches Christopher directly. The one case
> this doesn't cover is a visitor who reads `contact@crvro.com` off the
> page and manually types it into their own email client instead of
> clicking a link -- that message still bounces until real forwarding
> is configured at the registrar.

GitHub and LinkedIn links are live:
- GitHub: https://github.com/chrisrivero-dev
- LinkedIn: https://www.linkedin.com/in/christopherarivero

---

## Tech notes

- React 18, no router (single page, in-page anchors).
- No CSS framework — plain CSS variables in `tokens.css`.
- Fonts via Google Fonts CDN (Newsreader, Inter, Inter Tight, JetBrains Mono).
  To self-host, add `.ttf`/`.woff2` files under `public/fonts/` and replace
  the `@import` at the top of `tokens.css` with `@font-face` rules.
- No analytics, no tracking. Add Plausible/Fathom/Vercel Analytics later
  if you want.
