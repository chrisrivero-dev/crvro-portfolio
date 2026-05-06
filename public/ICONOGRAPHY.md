# Iconography

## System

The portfolio uses **[Lucide](https://lucide.dev)** for all functional icons. Inline SVGs vendored in the UI kit (`Icon.jsx`) — no CDN runtime.

## Why Lucide

- Stroke-based, hairline (1.5–1.75px). Matches the editorial / hairline-rule feel.
- No fills, no gradients, no two-tone, no rounded-cap whimsy.
- Free, open source, MIT.

## Usage rules

| Context | Size | Stroke | Color |
|---|---|---|---|
| Inline with body text | 16px | 1.75 | `currentColor` |
| UI default (buttons, menus) | 20px | 1.75 | `currentColor` |
| Section headers | 24px | 1.5  | `currentColor` |
| Hero accents (rare) | 32px | 1.5  | `var(--amber)` |

- Always `currentColor`. Never multi-color.
- Stroke 1.5–1.75. Never 2px+.
- Square hit area of 24px around any clickable icon.
- Icon + label preferred over icon-only buttons.
- **No emoji.** Anywhere.

## Icon vocabulary (recommended primitives)

| Use | Lucide name |
|---|---|
| Project / repo | `folder-git-2` |
| External link | `arrow-up-right` |
| Email | `mail` |
| GitHub | `github` |
| Terminal / CLI | `terminal` |
| AI / model | `cpu` |
| Map / GIS | `map-pin` |
| Trade / bot | `line-chart` |
| Telegram / chat | `send` |
| Local / on-device | `hard-drive` |
| Section anchor | `hash` |
| Read more | `arrow-right` |

## Custom marks

- `assets/wordmark.svg` — "Christopher Rivero" wordmark in Newsreader.
- `assets/favicon.svg` — square paper-on-paper `CR` favicon.
- `assets/monogram.svg` — circular dark `CR` monogram (use as avatar if needed).

## Project thumbnail marks

Project thumbnails are **rendered in CSS** (no images) — simple geometric shapes (circle, half-circle, arc, soft square, paired circles) filled with the project's assigned accent color. See `ui_kits/portfolio/ProjectMark.jsx` for the primitives.

## Functional unicode (allowed)

- `→` arrow forward · `↗` external · `↓` down to next section
- `·` mid-dot separator · `—` em dash · `–` en dash
- `§` section · `◆` filled diamond bullet (rare)

## Don'ts

- ❌ Filled icon sets (Heroicons solid, Material Filled)
- ❌ Multi-color or gradient icons
- ❌ Emoji as project markers
- ❌ Animated icon micro-interactions
