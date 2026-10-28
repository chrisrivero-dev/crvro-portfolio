# Career data: sources, what is shown, what is withheld

The career notebook (`/#career`), its reading surface and the plain LO-FI career page all render from one file, `src/data/career.js`. Nothing about employment is typed anywhere else.

## Sources found

| Source | Used for | Notes |
|---|---|---|
| Case-study registry (`src/data/projects.js`) | Highlights that link a case study (Sidecar, Parcel Engine) | Already public. Highlight text restates the registry's own problem, build and status wording. |
| Résumé drafts in `~/Downloads` and `~/Projects/AI-Job-Search/cv` (seven role-targeted variants, `.docx`) | Roles, dates, responsibilities | **Not a master résumé.** Each is tuned for a job. Only facts worded the same way in every variant that mentions them are used. |
| `Christopher_Rivero_Identity_Profile_v1.0.md` | Cross-check only | Written for an AI assistant's voice, not as an employment record. |
| LinkedIn export | **None found** | `documents/linkedin/` in the job-search repo holds only a `.gitkeep`. |
| Approved public résumé PDF | **None found** | See below. |

## What the notebook shows

| Role | Dates | Agreement across the drafts |
|---|---|---|
| FutureBit LLC, Senior Customer Support & Automation Specialist (part-time, remote) | July 2025 – Present | Identical in all drafts |
| County of Orange · Assessor, Senior GIS/Cadastral Technician | January 2014 – Present | Identical in all drafts |
| County of Orange · Assessor / Tax Collector, Assessment Technician II · Property Tax Technician | 2007 – 2014 | Identical; the two titles share one date range in every draft, so they are one entry |

Responsibilities are the résumé's non-numeric statements that appear in more than one draft. The four highlights are Sidecar and Parcel Engine (from the registry, with links to their case studies), FutureBit support operations, and County GIS/CAD data-quality tooling. A "Result" line appears only where a source documents one: Sidecar (a working prototype; approved wording reaches Freshdesk in under a minute, per its case study) and Parcel Engine (a research tool, no County data, not survey software).

## Withheld, and why (`CAREER_REVIEW` in `career.js`)

Needs your decision before anything on this list is published.

1. **LinkedIn URL conflict.** The site publishes `linkedin.com/in/christopherarivero` (Contact page, README). Every résumé draft says `linkedin.com/in/christopher-rivero-47b03b97`. The site's published URL is used. One of them may be stale.
2. **No approved résumé PDF.** Every draft carries a home city and a phone number. The notebook has no download action. To add one: put an approved file in `public/`, set `CONTACT.resumePdf` in `career.js`, and the notebook and LO-FI page both show it.
3. **"Cut processing time about 60%"** (Tkinter map-submission app). Appears in the drafts, documented nowhere else. Not shown.
4. **Other résumé-only figures:** 250–350 documents a week, a knowledge-platform adoption across "10+ staff", "12 years" / "18+ years", and "partnered on Apollo III launch readiness" (one draft only). Not shown.
5. **"Part-time"** is shown on the FutureBit role because the résumé says so. The request for this feature did not list it. Remove `type` from the role in `career.js` if you want it dropped.
6. **County tenure length.** The identity profile says "over twenty years"; the résumé starts in 2007 (19 years as of 2026). No duration is stated on the site.
7. **Early County roles.** No separate dates exist for Assessment Technician II and Property Tax Technician, so they stay one entry.
8. **County tools.** The SOP Search Hub and the map-submission app come from the résumé, not from a case study. The portfolio otherwise avoids County production claims (see Parcel Engine's disclaimer). Confirm these descriptions may be public.
9. **"Built end to end" / "from scratch"** (FutureBit support). Strong wording that differs between drafts. The page lists what was built instead.

`scripts/verify-career.cjs` asserts that none of the withheld figures, the conflicting URL, the phone prefix or the home city appears on either surface.
